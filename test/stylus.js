import test from 'ava';
import './helpers';

test('should support requiring stylus files', async t => {
  await t.context.bundle(__dirname + '/integration/stylus/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.styl'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.styl'],
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

test('should support requiring stylus files with dependencies', async t => {
  await t.context.bundle(__dirname + '/integration/stylus-deps/index.js');

  // a.styl shouldn't be included as a dependency that we can see.
  // stylus takes care of inlining it.
  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.styl'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.styl'],
        childBundles: []
      }
    ]
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 2);

  let css = t.context.fs.readFileSync('index.css');
  t.true(css.includes('.index'));
  t.true(css.includes('.a'));
  t.true(css.includes('-webkit-box'));
});

test('should support linking to assets with url() from stylus', async t => {
  await t.context.bundle(__dirname + '/integration/stylus-url/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.styl'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.styl'],
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

test('should support transforming stylus with postcss', async t => {
  await t.context.bundle(__dirname + '/integration/stylus-postcss/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.styl'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.styl'],
        childBundles: []
      }
    ]
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), '_index_g9mqo_1');

  const css = t.context.fs.readFileSync('index.css');
  t.true(css.includes('._index_g9mqo_1'));
});
