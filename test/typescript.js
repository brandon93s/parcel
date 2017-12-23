import test from 'ava';
import './helpers';

test('should produce a ts bundle using ES6 imports', async t => {
  const b = await t.context.bundle(
    __dirname + '/integration/typescript/index.ts'
  );

  t.is(b.assets.size, 2);
  t.is(b.childBundles.size, 0);

  const output = t.context.run();
  t.is(typeof output.count, 'function');
  t.is(output.count(), 3);
});

test('should produce a ts bundle using commonJS require', async t => {
  const b = await t.context.bundle(
    __dirname + '/integration/typescript-require/index.ts'
  );

  t.is(b.assets.size, 2);
  t.is(b.childBundles.size, 0);

  const output = t.context.run();
  t.is(typeof output.count, 'function');
  t.is(output.count(), 3);
});

test('should support json require', async t => {
  const b = await t.context.bundle(
    __dirname + '/integration/typescript-json/index.ts'
  );

  t.is(b.assets.size, 2);
  t.is(b.childBundles.size, 0);

  const output = t.context.run();
  t.is(typeof output.count, 'function');
  t.is(output.count(), 3);
});

test('should support env variables', async t => {
  const b = await t.context.bundle(
    __dirname + '/integration/typescript-env/index.ts'
  );

  t.is(b.assets.size, 1);
  t.is(b.childBundles.size, 0);

  const output = t.context.run();
  t.is(typeof output.env, 'function');
  t.is(output.env(), 'test');
});

test('should support importing a URL to a raw asset', async t => {
  await t.context.bundle(__dirname + '/integration/typescript-raw/index.ts');

  t.context.assertBundleTree({
    name: 'index.js',
    assets: ['index.ts', 'test.txt'],
    childBundles: [
      {
        type: 'txt',
        assets: ['test.txt'],
        childBundles: []
      }
    ]
  });

  const output = t.context.run();
  t.is(typeof output.getRaw, 'function');
  t.true(/^\/[\S]+\/[0-9a-f]+\.txt$/.test(output.getRaw()));
  t.true(t.context.fs.existsSync(t.context.path.basename(output.getRaw())));
});

test('should minify in production mode', async t => {
  const b = await t.context.bundle(
    __dirname + '/integration/typescript-require/index.ts',
    {production: true}
  );

  t.is(b.assets.size, 2);
  t.is(b.childBundles.size, 0);

  const output = t.context.run();
  t.is(typeof output.count, 'function');
  t.is(output.count(), 3);

  const js = t.context.fs.readFileSync('index.js');
  t.true(!js.includes('local.a'));
});

test('should support loading tsconfig.json', async t => {
  await t.context.bundle(__dirname + '/integration/typescript-config/index.ts');

  const output = t.context.run();
  t.is(output, 2);

  const js = t.context.fs.readFileSync('index.js');
  t.true(!js.includes('/* test comment */'));
});
