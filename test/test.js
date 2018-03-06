import Gobgp from '../index';
const gobgp = new Gobgp('localhost:50051');
const expect = require('chai').expect;
const exec = require('child_process').execSync;

describe('gobgp-node', () => {
  const global_rib = (prefix) => {
    const table = JSON.parse(exec('gobgp -j global rib'));
    if (prefix) {
      return table[prefix];
    } else {
      return table;
    }
  };

  const flowspec_rib = (prefix) => {
    const table = JSON.parse(exec('gobgp -j global rib -a ipv4-flowspec'));
    if (prefix) {
      return table[prefix];
    } else {
      return table;
    }
  };

  const communities = (prfix) => {
    const paths = global_rib(prefix);
    if (!paths) {
      return;
    }

    const comms = paths[0]['attrs'].filter((i) => i['type'] == 8);
    return comms[0]['communities'];
  };

  const PREFIX = '10.0.0.0/24';
  const FLOWSPEC_PREFIX = `match source ${PREFIX} then rate-limit 10000`;
  const FLOWSPEC_JSON_PREFIX = `[source:${PREFIX}]`;

  beforeEach(() => {
    exec(`gobgp global rib del ${PREFIX}`);
    exec(`gobgp global rib -a ipv4-flowspec del ${FLOWSPEC_PREFIX}`);
  });


  describe('family ipv4-unicast', () => {
    it('originates a route', () => {
      expect(global_rib()).to.be.empty;

      gobgp.addPath({family: 'ipv4-unicast'}, PREFIX, () => {
        const prefixes = global_rib(PREFIX);
        expect(prefixes.length).to.equal(1);
      });
    });

    it('originates a route with BGP community string', () => {
      expect(global_rib()).to.be.empty;

      gobgp.addPath({family: 'ipv4-unicast'}, `${PREFIX} community no-advertise`, () => {
        const prefixes = global_rib(PREFIX);
        expect(prefixes.length).to.equal(1);

        expect(communities(PREFIX)).to.eql([4294967042]);
      });
    });

    it('originates a route with BGP community byte array', () => {
      expect(global_rib()).to.be.empty;

      const path = gobgp.serializePath('ipv4-unicast', PREFIX);
      path.pattrs.push(new Buffer([
        0xc0, // Optional, Transitive
        0x08, // Type Code: Communities
        0x04, // Length
        0xff, 0xff, 0xff, 0x02 // NO_ADVERTISE
      ]));

      gobgp.addPath({family: 'ipv4-unicast'}, path, () => {
        const prefixes = global_rib(PREFIX);
        expect(prefixes.length).to.equal(1);

        expect(communities(PREFIX)).to.eql([4294967042]);
      });
    });

    it('shows the RIB', () => { // TODO: This does actually nothing. Use chai-as-promised
      exec(`gobgp global rib add ${PREFIX}`);

      gobgp.getRib({family: 'ipv4-unicast'}, (err, table) => {
        expect(table['type']).to.equal('GLOBAL');
        expect(table['family']).to.equal(65537);
        expect(table['destinations'].length).to.equal(1);

        const path = table['destinations'][0];
        expect(path['prefix']).to.equal(PREFIX);
      });
    });

    it('withdraws a route', () => {
      exec(`gobgp global rib add ${PREFIX}`);
      expect(global_rib()).not.to.be.empty;

      gobgp.deletePath({family: 'ipv4-unicast'}, PREFIX, () => {
        expect(global_rib()).to.be.empty;
      });
    });
  });


  describe('family ipv4-flowspec', () => {
    it('originates a route', () => {
      expect(flowspec_rib()).to.be.empty;

      gobgp.addPath({family: 'ipv4-flowspec'}, FLOWSPEC_PREFIX, () => {
        const prefixes = flowspec_rib(FLOWSPEC_JSON_PREFIX);
        expect(prefixes.length).to.equal(1);
      });
    });

    it('shows the RIB', () => { // TODO: This does actually nothing. Use chai-as-promised
      exec(`gobgp global rib -a ipv4-flowspec add ${FLOWSPEC_PREFIX}`);

      gobgp.getRib({family: 'ipv4-flowspec'}, (err, table) => {
        expect(table.type).to.equal('GLOBAL');
        expect(table.family).to.equal(65669);
        expect(table.destinations.length).to.equal(1);

        const path = table.destinations[0];
        expect(path.prefix).to.equal(`[source:${PREFIX}]`);
        expect(path.paths[0].attrs[2].value[0].rate).to.equal(10000);
      });
    });

    it('withdraws a route', () => {
      exec(`gobgp global rib -a ipv4-flowspec add ${FLOWSPEC_PREFIX}`);
      expect(flowspec_rib()).not.to.be.empty;

      gobgp.deletePath({family: 'ipv4-flowspec'}, FLOWSPEC_PREFIX, () => {
        expect(flowspec_rib()).to.be.empty;
      });
    });
  });

  describe('backward compatibility for modPath', () => {
    it('originates a route', () => {
      expect(global_rib()).to.be.empty;

      gobgp.modPath({family: 'ipv4-unicast'}, PREFIX, () => {
        const prefixes = global_rib(PREFIX);
        expect(prefixes.length).to.equal(1);
      });
    });

    it('withdraws a route', () => {
      exec(`gobgp global rib add ${PREFIX}`);
      expect(global_rib()).not.to.be.empty;

      gobgp.modPath({family: 'ipv4-unicast', withdraw: true}, PREFIX, () => {
        expect(global_rib()).to.be.empty;
      });
    });
  });
});
