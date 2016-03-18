Gobgp = require('../index')
gobgp = new Gobgp('localhost:50051')

expect = require('chai').expect
exec   = require('child_process').execSync

describe 'gobgp-node', ->
  global_rib = ->
    JSON.parse(exec('gobgp -j global rib'))

  communities = (prefix) ->
    table = global_rib()
    paths = table.filter (i) -> i['prefix']==prefix
    return if paths.empty?

    comms = paths[0]['paths'][0]['attrs'].filter (i) -> i['type']==8
    return comms[0]['communities']


  beforeEach ->
    exec 'gobgp global rib del 10.0.0.0/24'


  describe 'family ipv4-unicast', ->
    it 'originates a route', ->
      expect(global_rib()).to.be.empty

      gobgp.modPath family: 'ipv4-unicast', '10.0.0.0/24'

      table = global_rib()
      expect(table.length).to.equal 1
      expect(table[0]['prefix']).to.equal '10.0.0.0/24'

    it 'originates a route with BGP community string', ->
      expect(global_rib()).to.be.empty

      gobgp.modPath family: 'ipv4-unicast', '10.0.0.0/24 community no-advertise'

      table = global_rib()
      expect(table.length).to.equal 1
      expect(table[0]['prefix']).to.equal '10.0.0.0/24'

      expect(communities('10.0.0.0/24')).to.eql [4294967042]

    it 'originates a route with BGP community byte array', ->
      expect(global_rib()).to.be.empty

      path = gobgp.serializePath('ipv4-unicast', '10.0.0.0/24')
      path.pattrs.push new Buffer([
        0xc0,                      # Optional, Transitive
        0x08,                      # Type Code: Communities
        0x04,                      # Length
        0xff, 0xff, 0xff, 0x02])  # NO_ADVERTISE

      gobgp.modPath family: 'ipv4-unicast', path

      table = global_rib()
      expect(table.length).to.equal 1
      expect(table[0]['prefix']).to.equal '10.0.0.0/24'

      expect(communities('10.0.0.0/24')).to.eql [4294967042]

    it 'shows the RIB', ->
      exec 'gobgp global rib add 10.0.0.0/24'

      gobgp.getRib family: 'ipv4-unicast', (err, table) ->
        expect(table['type']).to.equal 'GLOBAL'
        expect(table['family']).to.equal 65537
        expect(table['destinations'].length).to.equal 1

        path = table['destinations'][0]
        expect(path['prefix']).to.equal '10.0.0.0/24'

    it 'withdraws a route', ->
      exec 'gobgp global rib add 10.0.0.0/24'
      expect(global_rib()).not.to.be.empty

      gobgp.modPath family: 'ipv4-unicast', withdraw: true, '10.0.0.0/24'

      expect(global_rib()).to.be.empty
