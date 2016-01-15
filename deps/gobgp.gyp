{
  'targets': [
    {
      'target_name': 'gobgp-c',
      'type': 'none',
      'conditions': [
        ['OS=="mac"', {
          'actions': [
            {
              'action_name': 'go build',
              'inputs': [ '<!@(ls -1 gobgp/gobgp/lib/*.go)' ],
              'outputs': [ 'libgobgp.so', 'libgobgp.h' ],
              'action': [ 'go', 'build', '-buildmode=c-shared', '-o', 'gobgp/libgobgp.so', '<!@(ls -1 gobgp/gobgp/lib/*.go)']
            }, {
              'action_name': 'change install_name',
              'inputs': [ 'gobgp/libgobgp.so' ],
              'outputs': [ 'gobgp/libgobgp.so' ],
              'action': [ 'install_name_tool', '-id', '@rpath/libgobgp.so', 'gobgp/libgobgp.so' ]
            }
          ]
        }]
      ]
    }
  ]
}
