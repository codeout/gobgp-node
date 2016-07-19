grpc = require('grpc')
protoDescriptor = grpc.load("#{__dirname}/deps/gobgp/gobgp.proto").gobgpapi
libgobgp = require('./build/Release/gobgp')

class Gobgp
  constructor: (server)->
    @stub = new protoDescriptor.GobgpApi(server, grpc.credentials.createInsecure())


  getRib: (options, callback)->
    if typeof(options.family) == 'string'
      options.family = @routeFamily(options.family)

    @stub.getRib {table: options}, (err, response)=>
      return callback(err) if err

      response.table.destinations.forEach (destination)=>
        destination.paths = destination.paths.map (path)=>
          decoded = JSON.parse(@decodePath(path))
          path.nlri = decoded.nlri.value
          path.attrs = decoded.attrs
          delete path.pattrs
          path

      callback(null, response.table) if callback


  modPath: (options, path, callback)->
    return callback("Invalid argument: path") unless path

    if typeof(path) == 'string'
      path = @serializePath(options.family, path)
      return callback("Invalid argument: path") unless path
      path.is_withdraw = options.withdraw

    @stub.addPath {path: path}, (err, response)->
      return(callback err) if err
      callback(null, response) if callback


  addPath: (options, path, callback)->
    @modPath options, path, callback


  deletePath: (options, path, callback)->
    options.withdraw = true
    @modPath options, path, callback


  routeFamily: (string)->
    libgobgp.get_route_family(string)


  serializePath: (family, string)->
    if typeof(family) == 'string'
      family = @routeFamily(family)
    libgobgp.serialize_path(family, string)


  decodePath: (path)->
    libgobgp.decode_path(path)


module.exports = Gobgp
