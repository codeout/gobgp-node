// Generated by CoffeeScript 1.12.4
(function() {
  var Gobgp, grpc, libgobgp, protoDescriptor,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  grpc = require('grpc');

  protoDescriptor = grpc.load(__dirname + "/deps/gobgp/gobgp.proto").gobgpapi;

  libgobgp = require('./build/Release/gobgp');

  Gobgp = (function() {
    function Gobgp(server) {
      this.modPath = bind(this.modPath, this);
      this.stub = new protoDescriptor.GobgpApi(server, grpc.credentials.createInsecure());
    }

    Gobgp.prototype.handleError = function(err, callback) {
      if (callback) {
        return callback(err);
      } else {
        return console.error(err);
      }
    };

    Gobgp.prototype.getRib = function(options, callback) {
      if (typeof options.family === 'string') {
        options.family = this.routeFamily(options.family);
      }
      return this.stub.getRib({
        table: options
      }, (function(_this) {
        return function(err, response) {
          if (err) {
            return _this.handleError(err, callback);
          }
          response.table.destinations.forEach(function(destination) {
            return destination.paths = destination.paths.map(function(path) {
              var decoded;
              decoded = JSON.parse(_this.decodePath(path));
              path.nlri = decoded.nlri.value;
              path.attrs = decoded.attrs;
              delete path.pattrs;
              return path;
            });
          });
          if (callback) {
            return callback(null, response.table);
          }
        };
      })(this));
    };

    Gobgp.prototype.modPath = function(options, path, callback) {
      var originalPath;
      if (!path) {
        this.handleError("Missing argument: path", callback);
      }
      originalPath = path;
      if (typeof path === 'string') {
        path = this.serializePath(options.family, path);
        if (!path) {
          return this.handleError("Invalid argument: path \"" + originalPath + "\"", callback);
        }
        path.is_withdraw = options.withdraw;
      }
      return this.stub.addPath({
        path: path
      }, (function(_this) {
        return function(err, response) {
          if (err) {
            return _this.handleError(err, callback);
          }
          if (callback) {
            return callback(null, response);
          }
        };
      })(this));
    };

    Gobgp.prototype.addPath = function(options, path, callback) {
      return this.modPath(options, path, callback);
    };

    Gobgp.prototype.deletePath = function(options, path, callback) {
      options.withdraw = true;
      return this.modPath(options, path, callback);
    };

    Gobgp.prototype.routeFamily = function(string) {
      return libgobgp.get_route_family(string);
    };

    Gobgp.prototype.serializePath = function(family, string) {
      if (typeof family === 'string') {
        family = this.routeFamily(family);
      }
      return libgobgp.serialize_path(family, string);
    };

    Gobgp.prototype.decodePath = function(path) {
      return libgobgp.decode_path(path);
    };

    return Gobgp;

  })();

  module.exports = Gobgp;

}).call(this);
