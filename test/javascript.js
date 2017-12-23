import test from 'ava';
import './helpers';

test('should produce a basic JS bundle with CommonJS requires', async t => {
  const b = await t.context.bundle(
    __dirname + '/integration/commonjs/index.js'
  );

  t.is(b.assets.size, 8);
  t.is(b.childBundles.size, 0);

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 3);
});

test('should produce a basic JS bundle with ES6 imports', async t => {
  const b = await t.context.bundle(__dirname + '/integration/es6/index.js');

  t.is(b.assets.size, 8);
  t.is(b.childBundles.size, 0);

  const output = t.context.run();
  t.is(typeof output, 'object');
  t.is(typeof output.default, 'function');
  t.is(output.default(), 3);
});

test('should produce a JS bundle with default exorts and no imports', async t => {
  const b = await t.context.bundle(
    __dirname + '/integration/es6-default-only/index.js'
  );

  t.is(b.assets.size, 1);
  t.is(b.childBundles.size, 0);

  const output = t.context.run();
  t.is(typeof output, 'object');
  t.is(typeof output.default, 'function');
  t.is(output.default(), 3);
});

test('should split bundles when a dynamic import is used', async t => {
  await t.context.bundle(__dirname + '/integration/dynamic/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'bundle-loader.js', 'bundle-url.js'],
    childBundles: [
      {
        assets: ['local.js'],
        childBundles: []
      }
    ]
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(await output(), 3);
});

test('should dynamic import files which import raw files', async t => {
  await t.context.bundle(
    __dirname + '/integration/dynamic-references-raw/index.js'
  );

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'bundle-loader.js', 'bundle-url.js'],
    childBundles: [
      {
        assets: ['local.js', 'test.txt'],
        childBundles: ['test.txt']
      }
    ]
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(await output(), 3);
});

test('should return all exports as an object when using ES modules', async t => {
  await t.context.bundle(__dirname + '/integration/dynamic-esm/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'bundle-loader.js', 'bundle-url.js'],
    childBundles: [
      {
        assets: ['local.js'],
        childBundles: []
      }
    ]
  });

  const output = t.context.run().default;
  t.is(typeof output, 'function');
  t.is(await output(), 3);
});

test('should hoist common dependencies into a parent bundle', async t => {
  await t.context.bundle(__dirname + '/integration/dynamic-hoist/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: [
      'index.js',
      'common.js',
      'common-dep.js',
      'bundle-loader.js',
      'bundle-url.js'
    ],
    childBundles: [
      {
        assets: ['a.js'],
        childBundles: []
      },
      {
        assets: ['b.js'],
        childBundles: []
      }
    ]
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(await output(), 7);
});

test('should support requiring JSON files', async t => {
  await t.context.bundle(__dirname + '/integration/json/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'local.json'],
    childBundles: []
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 3);
});

test('should support importing a URL to a raw asset', async t => {
  await t.context.bundle(__dirname + '/integration/import-raw/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'test.txt'],
    childBundles: [
      {
        type: 'txt',
        assets: ['test.txt'],
        childBundles: []
      }
    ]
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.true(/^\/[\S]+\/[0-9a-f]+\.txt$/.test(output()));
  t.true(t.context.fs.existsSync(t.context.path.basename(output())));
});

test('should minify JS in production mode', async t => {
  await t.context.bundle(__dirname + '/integration/uglify/index.js', {
    production: true
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 3);

  let js = t.context.fs.readFileSync('index.js');
  t.true(!js.includes('local.a'));
});

test('should use uglify config', async t => {
  await t.context.bundle(__dirname + '/integration/uglify-config/index.js', {
    production: true
  });

  let js = t.context.fs.readFileSync('index.js');
  t.true(js.includes('console.log'));
});

test('should insert global variables when needed', async t => {
  await t.context.bundle(__dirname + '/integration/globals/index.js');

  const output = t.context.run();
  t.deepEqual(output(), {
    dir: t.context.path.join(__dirname, '/integration/globals'),
    file: t.context.path.join(__dirname, '/integration/globals/index.js'),
    buf: new Buffer('browser').toString('base64'),
    global: true
  });
});

test('should insert environment variables', async t => {
  await t.context.bundle(__dirname + '/integration/env/index.js');

  const output = t.context.run();
  t.is(output(), 'test:test');
});

test('should support adding implicit dependencies', async t => {
  await t.context.bundle(__dirname + '/integration/json/index.js', {
    delegate: {
      getImplicitDependencies(asset) {
        if (asset.basename === 'index.js') {
          return [{name: __dirname + '/integration/css/index.css'}];
        }
      }
    }
  });

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'local.json', 'index.css'],
    childBundles: [
      {
        type: 'css',
        assets: ['index.css']
      }
    ]
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 3);
});

test('should support requiring YAML files', async t => {
  await t.context.bundle(__dirname + '/integration/yaml/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'local.yaml'],
    childBundles: []
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 3);
});

test('should support requiring CoffeeScript files', async t => {
  await t.context.bundle(__dirname + '/integration/coffee/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'local.coffee'],
    childBundles: []
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 3);
});

test('should resolve the browser field before main', async t => {
  await t.context.bundle(__dirname + '/integration/resolve-entries/browser.js');

  t.context.assertBundleTree({
    name: 'browser.js',
    assets: ['browser.js', 'browser-module.js'],
    childBundles: []
  });

  const output = t.context.run();

  t.is(typeof output.test, 'function');
  t.is(output.test(), 'pkg-browser');
});

test('should resolve advanced browser resolution', async t => {
  await t.context.bundle(
    __dirname + '/integration/resolve-entries/browser-multiple.js'
  );

  t.context.assertBundleTree({
    name: 'browser-multiple.js',
    assets: ['browser-multiple.js', 'projected-module.js'],
    childBundles: []
  });

  const output = t.context.run();

  t.is(typeof output.test, 'function');
  t.is(output.test(), 'pkg-browser-multiple');
});

test('should resolve the module field before main', async t => {
  await t.context.bundle(
    __dirname + '/integration/resolve-entries/module-field.js'
  );

  t.context.assertBundleTree({
    name: 'module-field.js',
    assets: ['module-field.js', 'es6.module.js'],
    childBundles: []
  });

  const output = t.context.run();

  t.is(typeof output.test, 'function');
  t.is(output.test(), 'pkg-es6-module');
});

test('should resolve the jsnext:main field before main', async t => {
  await t.context.bundle(
    __dirname + '/integration/resolve-entries/jsnext-field.js'
  );

  t.context.assertBundleTree({
    name: 'jsnext-field.js',
    assets: ['jsnext-field.js', 'jsnext.module.js'],
    childBundles: []
  });

  const output = t.context.run();

  t.is(typeof output.test, 'function');
  t.is(output.test(), 'pkg-jsnext-module');
});

test('should resolve the module field before jsnext:main', async t => {
  await t.context.bundle(
    __dirname + '/integration/resolve-entries/both-fields.js'
  );

  t.context.assertBundleTree({
    name: 'both-fields.js',
    assets: ['both-fields.js', 'es6.module.js'],
    childBundles: []
  });

  const output = t.context.run();

  t.is(typeof output.test, 'function');
  t.is(output.test(), 'pkg-es6-module');
});

test('should resolve the main field', async t => {
  await t.context.bundle(
    __dirname + '/integration/resolve-entries/main-field.js'
  );

  t.context.assertBundleTree({
    name: 'main-field.js',
    assets: ['main-field.js', 'main.js'],
    childBundles: []
  });

  const output = t.context.run();

  t.is(typeof output.test, 'function');
  t.is(output.test(), 'pkg-main-module');
});
