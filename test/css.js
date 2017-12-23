import test from 'ava';
import './helpers';
import promisify from '../src/utils/promisify';
const ncp = promisify(require('ncp'));

test('css: should produce two bundles when importing a CSS file', async t => {
  await t.context.bundle(__dirname + '/integration/css/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.css', 'local.js', 'local.css'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.css', 'local.css'],
        childBundles: []
      }
    ]
  });

  let output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 3);
});

test('css: should support loading a CSS bundle along side dynamic imports', async t => {
  await t.context.bundle(__dirname + '/integration/dynamic-css/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.css', 'bundle-loader.js', 'bundle-url.js'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.css'],
        childBundles: []
      },
      {
        type: 'js',
        assets: ['local.js', 'local.css'],
        childBundles: [
          {
            type: 'css',
            assets: ['local.css'],
            childBundles: []
          }
        ]
      }
    ]
  });

  let output = t.context.run();
  t.is(typeof output, 'function');
  t.is(await output(), 3);
});

test('css: should support importing CSS from a CSS file', async t => {
  await t.context.bundle(__dirname + '/integration/css-import/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.css', 'other.css', 'local.css'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.css', 'other.css', 'local.css'],
        childBundles: []
      }
    ]
  });

  let output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 2);

  let css = t.context.fs.readFileSync('index.css');
  t.true(css.includes('.local'));
  t.true(css.includes('.other'));
  t.true(/@media print {\s*.other/.test(css));
  t.true(css.includes('.index'));
});

test('css: should support linking to assets with url() from CSS', async t => {
  await t.context.bundle(__dirname + '/integration/css-url/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.css'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.css'],
        childBundles: []
      },
      {
        type: 'woff2',
        assets: ['test.woff2'],
        childBundles: []
      }
    ]
  });

  let output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 2);

  let css = t.context.fs.readFileSync('index.css');
  t.true(/url\("[0-9a-f]+\.woff2"\)/.test(css));
  t.true(css.includes('url("http://google.com")'));
  t.true(css.includes('.index'));
  t.true(css.includes('url("data:image/gif;base64,quotes")'));
  t.true(css.includes('.quotes'));
  t.true(css.includes('url(data:image/gif;base64,no-quote)'));
  t.true(css.includes('.no-quote'));
  t.true(t.context.fs.existsSync(css.match(/url\("([0-9a-f]+\.woff2)"\)/)[1]));
});

test('css: should support transforming with postcss', async t => {
  await t.context.bundle(__dirname + '/integration/postcss/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.css'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.css'],
        childBundles: []
      }
    ]
  });

  let output = t.context.run();
  t.is(typeof output, 'function');

  let value = output();
  t.true(/_index_[0-9a-z]+_1/.test(value));

  let cssClass = value.match(/(_index_[0-9a-z]+_1)/)[1];

  let css = t.context.fs.readFileSync('index.css');
  t.true(css.includes(`.${cssClass}`));
});

test('css: should minify CSS in production mode', async t => {
  await t.context.bundle(__dirname + '/integration/cssnano/index.js', {
    production: true
  });

  let output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 3);

  let css = t.context.fs.readFileSync('index.css');
  t.true(css.includes('.local'));
  t.true(css.includes('.index'));
  t.true(!css.includes('\n'));
});

test('css: should automatically install postcss plugins with npm if needed', async t => {
  await ncp(
    __dirname + '/integration/autoinstall/npm',
    t.context.path.join(t.context.dir, '/input')
  );
  await t.context.bundle(t.context.dir + '/input/index.css');

  // cssnext was installed
  let pkg = require(t.context.path.join(t.context.dir, './input/package.json'));
  t.truthy(pkg.devDependencies['postcss-cssnext']);

  // cssnext is applied
  let css = t.context.fs.readFileSync('index.css');
  t.true(css.includes('rgba'));
});

test('css: should automatically install postcss plugins with yarn if needed', async t => {
  await ncp(
    __dirname + '/integration/autoinstall/yarn',
    t.context.path.join(t.context.dir, '/input')
  );
  await t.context.bundle(t.context.dir + '/input/index.css');

  // cssnext was installed
  let pkg = require(t.context.path.join(t.context.dir, './input/package.json'));
  t.truthy(pkg.devDependencies['postcss-cssnext']);

  // appveyor is not currently writing to the yarn.lock file and will require further investigation
  // let lockfile = fs.fs.readFileSync(__dirname + '/input/yarn.lock', 'utf8');
  // t.true(lockfile.includes('postcss-cssnext'));

  // cssnext is applied
  let css = t.context.fs.readFileSync('index.css');
  t.true(css.includes('rgba'));
});
