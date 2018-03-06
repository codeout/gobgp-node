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
    key: 'getRib',
    value: function getRib(options) {
      var _this = this;

      if (typeof options.family == 'string') {
        options.family = this.routeFamily(options.family);
      }

      return new Promise(function (resolve, reject) {
        _this.stub.getRib({ table: options }, function (err, response) {
          if (err) {
            reject(err);
          } else {
            response.table.destinations.forEach(function (destination) {
              destination.paths = destination.paths.map(function (path) {
                var decoded = JSON.parse(_this.decodePath(path));

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
  }, {
    key: 'getRibInfo',
    value: function getRibInfo(options) {
      var _this2 = this;

      if (typeof options.family == 'string') {
        options.family = this.routeFamily(options.family);
      }

      return new Promise(function (resolve, reject) {
        _this2.stub.getRibInfo({ info: options }, function (err, response) {
          if (err) {
            reject(err);
          } else {
            ['num_destination', 'num_path', 'num_accepted'].forEach(function (i) {
              response.info[i] = parseInt(response.info[i]);
            });
            resolve(response.info);
          }
        });
      });
    }
  }, {
    key: 'modPath',
    value: function modPath(options, path) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        if (!path) {
          reject('Missing argument: path');
        }
        var originalPath = path;

        if (typeof path == 'string') {
          path = _this3.serializePath(options.family, path);

          if (!path) {
            reject('Invalid argument: path "' + originalPath + '"');
          }
          path.is_withdraw = options.withdraw;
        }

        _this3.stub.addPath({ path: path }, function (err, response) {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
    }
  }, {
    key: 'addPath',
    value: function addPath(options, path) {
      return this.modPath(options, path);
    }
  }, {
    key: 'deletePath',
    value: function deletePath(options, path) {
      options.withdraw = true;
      return this.modPath(options, path);
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
