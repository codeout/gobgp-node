{
  'targets': [
    {
      'target_name': 'gobgp',
      'sources': [ 'src/gobgp.cc' ],
      'dependencies': [
        'deps/gobgp.gyp:gobgp-c'
      ],
      'conditions': [
        ['OS=="mac"', {
          'include_dirs': [
            '<(module_root_dir)/deps/gobgp'
          ],
          'xcode_settings': {
            'OTHER_LDFLAGS': [
              '-Wl,-rpath,<(module_root_dir)/deps/gobgp',
              '-L<(module_root_dir)/deps/gobgp'
            ]
          },
          'libraries': [ '-lgobgp' ]
        }]
      ]
    }
  ]
}
