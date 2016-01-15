grpc = require('grpc')
protoDescriptor = grpc.load("#{__dirname}/deps/gobgp/api/gobgp.proto").gobgpapi
libgobgp = require('./build/Release/gobgp')

class Gobgp
  @AFI_IP:  1
  @AFI_IP6: 2
  @SAFI_FLOW_SPEC_UNICAST: 133
  @RF_FS_IPv4_UC: @AFI_IP<<16 | @SAFI_FLOW_SPEC_UNICAST
  @RF_FS_IPv6_UC: @AFI_IP6<<16 | @SAFI_FLOW_SPEC_UNICAST

  constructor: (server)->
    @stub = new protoDescriptor.GobgpApi(server, grpc.Credentials.createInsecure())

  getRib: (options, callback)->
    @stub.getRib options, (err, table)->
      return console.error(err) if err

      table.destinations.forEach (destination)->
        destination.paths = destination.paths.map (path)->
          decoded = JSON.parse(libgobgp.decode_path(path))
          path.nlri = decoded.nlri.value
          path.attrs = decoded.attrs
          delete path.pattrs
          path

      callback table if callback

  modPath: (family, string, callback)->
    path = libgobgp.serialize_path(family, string)

    @stub.modPath {path: path}, (err, response)->
      return console.error(err) if err
      callback response if callback


module.exports = Gobgp
