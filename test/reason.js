import test from 'ava';
import './helpers';

test('should produce a bundle', async t => {
  const b = await t.context.bundle(__dirname + '/integration/reason/index.js');

  t.is(b.assets.size, 2);
  t.is(b.childBundles.size, 0);

  const output = t.context.run();
  t.is(typeof output, 'function');
  t.is(output(), 3);
});
