const {
  babelCompatSupport,
  templateCompatSupport,
} = require('@embroider/compat/babel');

module.exports = {
  ignore: ['node_modules/@ember-data/json-api'],
  plugins: [
    [
      '@babel/plugin-transform-typescript',
      {
        allExtensions: true,
        onlyRemoveTypeImports: true,
        allowDeclareFields: true,
      },
    ],
    [
      'babel-plugin-ember-template-compilation',
      {
        // ember-source v7+ no longer ships the flat dist/ember-template-compiler.js
        // file this hardcoded string used to point at -- the compiler now lives
        // behind package exports instead. Resolve it explicitly rather than
        // relying on the plugin's own runtime auto-detection, which goes through
        // `import-meta-resolve` and can fail unpredictably inside Vite's own
        // process (see TODO.md's Ember 7 upgrade section).
        compilerPath: require.resolve(
          'ember-source/ember-template-compiler/index.js'
        ),
        enableLegacyModules: [
          'ember-cli-htmlbars',
          'ember-cli-htmlbars-inline-precompile',
          'htmlbars-inline-precompile',
        ],
        transforms: [...templateCompatSupport()],
      },
    ],
    [
      'module:decorator-transforms',
      {
        runtime: {
          import: require.resolve('decorator-transforms/runtime-esm'),
        },
      },
    ],
    [
      '@babel/plugin-transform-runtime',
      {
        absoluteRuntime: __dirname,
        useESModules: true,
        regenerator: false,
      },
    ],
    ...babelCompatSupport(),
  ],

  generatorOpts: {
    compact: false,
  },
};
