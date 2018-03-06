import grpc from 'grpc';
const protoDescriptor = grpc.load(`${__dirname}/deps/gobgp/gobgp.proto`).gobgpapi;
import libgobgp from './build/Release/gobgp';

class Gobgp {
  constructor(server) {
    this.stub = new protoDescriptor.GobgpApi(server, grpc.credentials.createInsecure());
  }

  handleError(err, callback) {
    if (callback) {
      return callback(err);
    } else {
      return console.error(err);
    }
  }

  getRib(options, callback) {
    if (typeof (options.family) == 'string') {
      options.family = this.routeFamily(options.family);
    }

    this.stub.getRib({table: options}, (err, response) => {
      if (err) {
        return this.handleError(err, callback);
      }

      response.table.destinations.forEach((destination) => {
        destination.paths = destination.paths.map((path) => {
          const decoded = JSON.parse(this.decodePath(path));

          path.nlri = decoded.nlri.value;
          path.attrs = decoded.attrs;
          delete path.pattrs;

          return path;
        });
      });

      if (callback) {
        return callback(null, response.table);
      }
    });
  }

  modPath(options, path, callback) {
    if (!path) {
      this.handleError('Missing argument: path', callback);
    }
    const originalPath = path;

    if (typeof (path) == 'string') {
      path = this.serializePath(options.family, path);

      if (!path) {
        return this.handleError(`Invalid argument: path "${originalPath}"`, callback);
      }
      path.is_withdraw = options.withdraw;
    }

    this.stub.addPath({path: path}, (err, response) => {
      if (err) {
        return this.handleError(err, callback);
      }
      if (callback) {
        return callback(null, response);
      }
    });
  }

  addPath(options, path, callback) {
    return this.modPath(options, path, callback);
  }

  deletePath(options, path, callback) {
    options.withdraw = true;
    return this.modPath(options, path, callback);
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
