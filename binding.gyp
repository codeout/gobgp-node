{
  'targets': [
    {
      'target_name': 'gobgp',
      'sources': [ 'src/gobgp.cc' ],
      'dependencies': [
        'deps/gobgp.gyp:gobgp-c'
      ],
      'include_dirs': [
        '<(module_root_dir)/deps/gobgp'
      ],
      'conditions': [
        ['OS=="mac"', {
          'xcode_settings': {
            'OTHER_LDFLAGS': [
              '-Wl,-rpath,<(module_root_dir)/deps/gobgp',
              '-L<(module_root_dir)/deps/gobgp'
            ]
          },
          'libraries': [ '-lgobgp' ]
        }],
        ['OS=="linux"', {
          'ldflags': [
            '-Wl,-rpath,<(module_root_dir)/deps/gobgp',
            '-L<(module_root_dir)/deps/gobgp'
          ],
          'libraries': [ '-lgobgp' ]
        }]
      ]
    }
  ]
}
