'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _grpc = require('grpc');

var _grpc2 = _interopRequireDefault(_grpc);

var _gobgp = require('./build/Release/gobgp');

var _gobgp2 = _interopRequireDefault(_gobgp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var protoDescriptor = _grpc2.default.load(__dirname + '/deps/gobgp/gobgp.proto').gobgpapi;

var Gobgp = function () {
  function Gobgp(server) {
    _classCallCheck(this, Gobgp);

    this.stub = new protoDescriptor.GobgpApi(server, _grpc2.default.credentials.createInsecure());
  }

  _createClass(Gobgp, [{
    key: 'handleError',
    value: function handleError(err, callback) {
      if (callback) {
        return callback(err);
      } else {
        return console.error(err);
      }
    }
  }, {
    key: 'getRib',
    value: function getRib(options, callback) {
      var _this = this;

      if (typeof options.family == 'string') {
        options.family = this.routeFamily(options.family);
      }

      this.stub.getRib({ table: options }, function (err, response) {
        if (err) {
          return _this.handleError(err, callback);
        }

        response.table.destinations.forEach(function (destination) {
          destination.paths = destination.paths.map(function (path) {
            var decoded = JSON.parse(_this.decodePath(path));

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
  }, {
    key: 'modPath',
    value: function modPath(options, path, callback) {
      var _this2 = this;

      if (!path) {
        this.handleError('Missing argument: path', callback);
      }
      var originalPath = path;

      if (typeof path == 'string') {
        path = this.serializePath(options.family, path);

        if (!path) {
          return this.handleError('Invalid argument: path "' + originalPath + '"', callback);
        }
        path.is_withdraw = options.withdraw;
      }

      this.stub.addPath({ path: path }, function (err, response) {
        if (err) {
          return _this2.handleError(err, callback);
        }
        if (callback) {
          return callback(null, response);
        }
      });
    }
  }, {
    key: 'addPath',
    value: function addPath(options, path, callback) {
      return this.modPath(options, path, callback);
    }
  }, {
    key: 'deletePath',
    value: function deletePath(options, path, callback) {
      options.withdraw = true;
      return this.modPath(options, path, callback);
    }
  }, {
    key: 'routeFamily',
    value: function routeFamily(string) {
      return _gobgp2.default.get_route_family(string);
    }
  }, {
    key: 'serializePath',
    value: function serializePath(family, string) {
      if (typeof family == 'string') {
        family = this.routeFamily(family);
      }
      return _gobgp2.default.serialize_path(family, string);
    }
  }, {
    key: 'decodePath',
    value: function decodePath(path) {
      return _gobgp2.default.decode_path(path);
    }
  }]);

  return Gobgp;
}();

module.exports = Gobgp;
