import test from 'ava';
import './helpers';

test('less: should support requiring less files', async t => {
  await t.context.bundle(__dirname + '/integration/less/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.less'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.less'],
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

test('less: should support less imports', async t => {
  await t.context.bundle(__dirname + '/integration/less-import/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.less'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.less'],
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

test('less: should support linking to assets with url() from less', async t => {
  await t.context.bundle(__dirname + '/integration/less-url/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.less'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.less'],
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

test('less: should support transforming less with postcss', async t => {
  await t.context.bundle(__dirname + '/integration/less-postcss/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.less'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.less'],
        childBundles: []
      }
    ]
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), '_index_ku5n8_1');

  const css = t.context.fs.readFileSync('index.css');
  t.true(css.includes('._index_ku5n8_1'));
});
