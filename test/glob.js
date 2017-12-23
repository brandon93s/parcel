import test from 'ava';
import './helpers';

test('glob: should require a glob of files', async t => {
  await t.context.bundle(__dirname + '/integration/glob/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', '*.js', 'a.js', 'b.js'],
    childBundles: []
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(await output(), 3);
});

test('glob: should require nested directories with a glob', async t => {
  await t.context.bundle(__dirname + '/integration/glob-deep/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', '*.js', 'a.js', 'b.js', 'c.js', 'z.js'],
    childBundles: []
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(await output(), 13);
});

test('glob: should support importing a glob of CSS files', async t => {
  await t.context.bundle(__dirname + '/integration/glob-css/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'index.css', '*.css', 'other.css', 'local.css'],
    childBundles: [
      {
        name: 'index.css',
        assets: ['index.css', 'other.css', 'local.css'],
        childBundles: []
      }
    ]
  });

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 2);

  const css = t.context.fs.readFileSync('index.css');
  t.true(css.includes('.local'));
  t.true(css.includes('.other'));
  t.true(css.includes('.index'));
});
