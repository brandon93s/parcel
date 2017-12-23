import test from 'ava';
import './helpers';

test('html: should support bundling HTML', async t => {
  await t.context.bundle(__dirname + '/integration/html/index.html');

  t.context.assertBundleTree({
    name: 'index.html',
    assets: ['index.html'],
    childBundles: [
      {
        type: 'css',
        assets: ['index.css'],
        childBundles: []
      },
      {
        type: 'html',
        assets: ['other.html'],
        childBundles: [
          {
            type: 'js',
            assets: ['index.js'],
            childBundles: []
          }
        ]
      }
    ]
  });

  const files = t.context.fs.readdirSync(t.context.dir);
  const html = t.context.fs.readFileSync('index.html');
  for (let file of files) {
    if (file !== 'index.html') {
      t.true(html.includes(file));
    }
  }
});

test('html: should support transforming HTML with posthtml', async t => {
  await t.context.bundle(__dirname + '/integration/posthtml/index.html');

  t.context.assertBundleTree({
    name: 'index.html',
    assets: ['index.html'],
    childBundles: []
  });

  const html = t.context.fs.readFileSync('index.html');
  t.true(html.includes('<h1>Other page</h1>'));
});

test('html: should insert sibling CSS bundles for JS files in the HEAD', async t => {
  await t.context.bundle(__dirname + '/integration/html-css/index.html');

  t.context.assertBundleTree({
    name: 'index.html',
    assets: ['index.html'],
    childBundles: [
      {
        type: 'js',
        assets: ['index.js', 'index.css'],
        childBundles: [
          {
            type: 'css',
            assets: ['index.css'],
            childBundles: []
          }
        ]
      }
    ]
  });

  const html = t.context.fs.readFileSync('index.html');
  t.true(
    /<link rel="stylesheet" href="[/\\]{1}[\S]+[/\\]{1}[a-f0-9]+\.css">/.test(
      html
    )
  );
});

test('html: should insert a HEAD element if needed when adding CSS bundles', async t => {
  await t.context.bundle(__dirname + '/integration/html-css-head/index.html');

  t.context.assertBundleTree({
    name: 'index.html',
    assets: ['index.html'],
    childBundles: [
      {
        type: 'js',
        assets: ['index.js', 'index.css'],
        childBundles: [
          {
            type: 'css',
            assets: ['index.css'],
            childBundles: []
          }
        ]
      }
    ]
  });

  const html = t.context.fs.readFileSync('index.html');
  t.true(
    /<head><link rel="stylesheet" href="[/\\]{1}[\S]+[/\\]{1}[a-f0-9]+\.css"><\/head>/.test(
      html
    )
  );
});

test('html: should minify HTML in production mode', async t => {
  await t.context.bundle(__dirname + '/integration/htmlnano/index.html', {
    production: true
  });

  const html = t.context.fs.readFileSync('index.html');
  t.true(html.includes('Other page'));
  t.true(!html.includes('\n'));
});

test('html: should not prepend the public path to assets with remote URLs', async t => {
  await t.context.bundle(__dirname + '/integration/html/index.html');

  const html = t.context.fs.readFileSync('index.html');
  t.true(
    html.includes('<script src="https://unpkg.com/parcel-bundler"></script>')
  );
});

test('html: should not prepend the public path to hash links', async t => {
  await t.context.bundle(__dirname + '/integration/html/index.html');

  const html = t.context.fs.readFileSync('index.html');
  t.true(html.includes('<a href="#hash_link">'));
});

test('html: should not update root/main file in the bundles', async t => {
  await t.context.bundle(__dirname + '/integration/html-root/index.html');

  const files = t.context.fs.readdirSync(t.context.dir);

  for (const file of files) {
    if (file !== 'index.html' && file.endsWith('.html')) {
      const html = t.context.fs.readFileSync(file);
      t.true(html.includes('index.html'));
    }
  }
});

test('html: should conserve the spacing in the HTML tags', async t => {
  await t.context.bundle(__dirname + '/integration/html/index.html', {
    production: true
  });

  const html = t.context.fs.readFileSync('index.html');
  t.true(/<i>hello<\/i> <i>world<\/i>/.test(html));
});
