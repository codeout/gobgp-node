import grpc from 'grpc';
const protoDescriptor = grpc.load(`${__dirname}/deps/gobgp/gobgp.proto`).gobgpapi;
import libgobgp from './build/Release/gobgp';

class Gobgp {
  constructor(server) {
    this.stub = new protoDescriptor.GobgpApi(server, grpc.credentials.createInsecure());
  }

  getRib(options) {
    if (typeof (options.family) == 'string') {
      options.family = this.routeFamily(options.family);
    }

    return new Promise((resolve, reject) => {
      this.stub.getRib({table: options}, (err, response) => {
        if (err) {
          reject(err);
        } else {
          response.table.destinations.forEach((destination) => {
            destination.paths = destination.paths.map((path) => {
              const decoded = JSON.parse(this.decodePath(path));

              path.nlri = decoded.nlri.value;
              path.attrs = decoded.attrs;
              delete path.pattrs;

              return path;
            });
          });

          resolve(response.table);
        }
      });
    });
  }

  getRibInfo(options) {
    if (typeof (options.family) == 'string') {
      options.family = this.routeFamily(options.family);
    }

    return new Promise((resolve, reject) => {
      this.stub.getRibInfo({info: options}, (err, response) => {
        if (err) {
          reject(err);
        } else {
          ['num_destination', 'num_path', 'num_accepted'].forEach((i) => {
            response.info[i] = parseInt(response.info[i]);
          });
          resolve(response.info);
        }
      });
    });
  }

  modPath(options, path) {
    return new Promise((resolve, reject) => {
      if (!path) {
        reject('Missing argument: path');
      }
      const originalPath = path;

      if (typeof (path) == 'string') {
        path = this.serializePath(options.family, path);

        if (!path) {
          reject(`Invalid argument: path "${originalPath}"`);
        }
        path.is_withdraw = options.withdraw;
      }

      this.stub.addPath({path: path}, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  addPath(options, path) {
    return this.modPath(options, path);
  }

  deletePath(options, path) {
    options.withdraw = true;
    return this.modPath(options, path);
  }

  routeFamily(string) {
    return libgobgp.get_route_family(string);
  }

  serializePath(family, string) {
    if (typeof (family) == 'string') {
      family = this.routeFamily(family);
    }
    return libgobgp.serialize_path(family, string);
  }

  decodePath(path) {
    return libgobgp.decode_path(path);
  }
}

module.exports = Gobgp;
