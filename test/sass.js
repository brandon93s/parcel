import test from 'ava';
import './helpers';

test('sass: should support requiring sass files', async t => {
  await t.context.bundle(__dirname + '/integration/sass/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.sass'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.sass'],
        childBundles: []
      }
    ]
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 2);

  const css = t.context.fs.readFileSync('index.css');
  t.true(css.includes('.index'));
});

test('sass: should support requiring scss files', async t => {
  await t.context.bundle(__dirname + '/integration/scss/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.scss'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.scss'],
        childBundles: []
      }
    ]
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 2);

  const css = t.context.fs.readFileSync('index.css');
  t.true(css.includes('.index'));
});

test('sass: should support scss imports', async t => {
  await t.context.bundle(__dirname + '/integration/scss-import/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.scss'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.scss'],
        childBundles: []
      }
    ]
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 2);

  const css = t.context.fs.readFileSync('index.css');
  t.true(css.includes('.index'));
  t.true(css.includes('.base'));
});

test('sass: should support linking to assets with url() from scss', async t => {
  await t.context.bundle(__dirname + '/integration/scss-url/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.scss'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.scss'],
        childBundles: []
      },
      {
        type: 'woff2',
        assets: ['test.woff2'],
        childBundles: []
      }
    ]
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 2);

  const css = t.context.fs.readFileSync('index.css');
  t.true(/url\("[0-9a-f]+\.woff2"\)/.test(css));
  t.true(css.includes('url("http://google.com")'));
  t.true(css.includes('.index'));
  t.true(t.context.fs.existsSync(css.match(/url\("([0-9a-f]+\.woff2)"\)/)[1]));
});

test('sass: should support transforming scss with postcss', async t => {
  await t.context.bundle(__dirname + '/integration/scss-postcss/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.scss'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.scss'],
        childBundles: []
      }
    ]
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), '_index_1a1ih_1');

  const css = t.context.fs.readFileSync('index.css');
  t.true(css.includes('._index_1a1ih_1'));
});
