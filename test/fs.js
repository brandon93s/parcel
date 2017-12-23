import test from 'ava';
import './helpers';

test('fs: should inline a file as a string', async t => {
  await t.context.bundle(__dirname + '/integration/fs/index.js');
  const output = t.context.run();
  t.is(output, 'hello');
});

test('fs: should inline a file as a buffer', async t => {
  await t.context.bundle(__dirname + '/integration/fs-buffer/index.js');
  const output = t.context.run();
  t.is(output.constructor.name, 'Buffer');
  t.is(output.length, 5);
});

test('fs: should inline a file with fs require alias', async t => {
  await t.context.bundle(__dirname + '/integration/fs-alias/index.js');
  const output = t.context.run();
  t.is(output, 'hello');
});

test('fs: should inline a file with fs require inline', async t => {
  await t.context.bundle(__dirname + '/integration/fs-inline/index.js');
  const output = t.context.run();
  t.is(output, 'hello');
});

test('fs: should inline a file with fs require assignment', async t => {
  await t.context.bundle(__dirname + '/integration/fs-assign/index.js');
  const output = t.context.run();
  t.is(output, 'hello');
});

test('fs: should inline a file with fs require assignment alias', async t => {
  await t.context.bundle(__dirname + '/integration/fs-assign-alias/index.js');
  const output = t.context.run();
  t.is(output, 'hello');
});

test('fs: should inline a file with fs require destructure', async t => {
  await t.context.bundle(__dirname + '/integration/fs-destructure/index.js');
  const output = t.context.run();
  t.is(output, 'hello');
});

test('fs: should inline a file with fs require destructure assignment', async t => {
  await t.context.bundle(
    __dirname + '/integration/fs-destructure-assign/index.js'
  );
  const output = t.context.run();
  t.is(output, 'hello');
});
