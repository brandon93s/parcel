import test from 'ava';
import './helpers';

test('should load plugins and apply custom asset type', async t => {
  await t.context.bundle(__dirname + '/integration/plugins/index.js');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'test.txt'],
    childBundles: []
  });

  const output = t.context.run();
  t.is(output, 'hello world');
});

test('should load package.json from parent tree', async t => {
  await t.context.bundle(
    __dirname + '/integration/plugins/sub-folder/index.js'
  );

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.js', 'test.txt'],
    childBundles: []
  });

  const output = t.context.run();
  t.is(output, 'hello world');
});
