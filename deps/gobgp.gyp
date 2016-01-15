{
  'targets': [
    {
      'target_name': 'gobgp-c',
      'type': 'none',
      'variables': {
        'files': [ '<!@(ls -1 $GOPATH/src/github.com/osrg/gobgp/gobgp/lib/*.go)' ],
        'proto': '$(GOPATH)/src/github.com/osrg/gobgp/api/gobgp.proto'
      },
      'conditions': [
        ['OS=="mac"', {
          'actions': [
            {
              'action_name': 'go build',
              'inputs': [ '<@(files)' ],
              'outputs': [ 'libgobgp.so', 'libgobgp.h' ],
              'action': [ 'go', 'build', '-buildmode=c-shared', '-o', 'gobgp/libgobgp.so', '<@(files)' ]
            }, {
              'action_name': 'change install_name',
              'inputs': [ 'gobgp/libgobgp.so' ],
              'outputs': [ 'gobgp/libgobgp.so' ],
              'action': [ 'install_name_tool', '-id', '@rpath/libgobgp.so', 'gobgp/libgobgp.so' ]
            }, {
              'action_name': 'copy .proto',
              'inputs': [ '<(proto)' ],
              'outputs': [ 'gobgp.proto' ],
              'action': [ 'cp', '<(proto)', 'gobgp' ]
            }
          ]
        }],
        ['OS=="linux"', {
          'actions': [
            {
              'action_name': 'go build',
              'inputs': [ '<@(files)' ],
              'outputs': [ 'libgobgp.so', 'libgobgp.h' ],
              'action': [ 'go', 'build', '-buildmode=c-shared', '-o', 'gobgp/libgobgp.so', '<@(files)' ]
            }, {
              'action_name': 'copy .proto',
              'inputs': [ '<(proto)' ],
              'outputs': [ 'gobgp.proto' ],
              'action': [ 'cp', '<(proto)', 'gobgp' ]
            }
          ]
        }]
      ]
    }
  ]
}
