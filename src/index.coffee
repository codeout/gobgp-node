grpc = require('grpc')
protoDescriptor = grpc.load("#{__dirname}/deps/gobgp/gobgp.proto").gobgpapi
libgobgp = require('./build/Release/gobgp')

class Gobgp
  constructor: (server)->
    @stub = new protoDescriptor.GobgpApi(server, grpc.Credentials.createInsecure())


  getRib: (options, callback)->
    if typeof(options.family) == 'string'
      options.family = @routeFamily(options.family)

    @stub.getRib options, (err, table)=>
      return callback(err) if err

      table.destinations.forEach (destination)=>
        destination.paths = destination.paths.map (path)=>
          decoded = JSON.parse(@decodePath(path))
          path.nlri = decoded.nlri.value
          path.attrs = decoded.attrs
          delete path.pattrs
          path

      callback(null, table) if callback


  modPath: (family, path, callback)->
    if typeof(path) == 'string'
      path = @serializePath(family, path)
    return callback("Invalid argument: path") unless path

    @stub.modPath {path: path}, (err, response)->
      return(callback err) if err
      callback(null, response) if callback


  routeFamily: (string)->
    libgobgp.get_route_family(string)


  serializePath: (family, string)->
    if typeof(family) == 'string'
      family = @routeFamily(family)
    libgobgp.serialize_path(family, string)


  decodePath: (path)->
    libgobgp.decode_path(path)


module.exports = Gobgp
