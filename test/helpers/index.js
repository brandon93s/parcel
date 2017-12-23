const test = require('ava').test;
const temp = require('temp');
const Bundler = require('../../');
const path = require('path');
const vm = require('vm');
const fs = require('fs');
const WebSocket = require('ws');

temp.track();

test.beforeEach(async t => {
  t.context.fs = t.context.path = {};
  t.context.dir = temp.mkdirSync();
  const dirOpts = {outDir: t.context.dir};

  t.context.bundler = (file, opts) => {
    t.context.bndlr = bundler(file, opts);
    return t.context.bndlr;
  };

  t.context.bundle = async (file, opts) => {
    t.context.b = await bundle(file, Object.assign(dirOpts, opts));
    return t.context.b;
  };

  t.context.assertBundleTree = tree => {
    assertBundleTree(t, t.context.b, tree);
  };

  t.context.run = globals => {
    return run(t.context.b, globals, t.context.dir);
  };

  t.context.fs.readFileSync = file => {
    return fs.readFileSync(path.join(t.context.dir, file), 'utf8');
  };

  t.context.fs.writeFileSync = (file, content) => {
    return fs.writeFileSync(path.join(t.context.dir, file), content);
  };

  t.context.fs.existsSync = file => {
    return fs.existsSync(path.join(t.context.dir, file));
  };

  t.context.fs.readdirSync = fs.readdirSync;

  t.context.path.join = (...args) => {
    return path.join(...args);
  };

  t.context.path.basename = path.basename;
});

function bundler(file, opts) {
  return new Bundler(
    file,
    Object.assign(
      {
        watch: false,
        cache: false,
        killWorkers: false,
        hmr: false,
        logLevel: 0
      },
      opts
    )
  );
}

function bundle(file, opts) {
  return bundler(file, opts).bundle();
}

function run(bundle, globals, outDir) {
  // for testing dynamic imports
  const fakeDocument = {
    createElement(tag) {
      return {tag};
    },

    getElementsByTagName() {
      return [
        {
          appendChild(el) {
            setTimeout(function() {
              if (el.tag === 'script') {
                vm.runInContext(
                  fs.readFileSync(path.join(outDir, el.src)),
                  ctx
                );
              }

              el.onload();
            }, 0);
          }
        }
      ];
    }
  };

  var ctx = Object.assign(
    {
      document: fakeDocument,
      WebSocket,
      console
    },
    globals
  );

  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(bundle.name), ctx);
  return ctx.require(bundle.entryAsset.id);
}

function assertBundleTree(t, bundle, tree) {
  if (tree.name) {
    t.is(path.basename(bundle.name), tree.name);
  }

  if (tree.type) {
    t.is(bundle.type, tree.type);
  }

  if (tree.assets) {
    t.deepEqual(
      Array.from(bundle.assets)
        .map(a => a.basename)
        .sort(),
      tree.assets.sort()
    );
  }

  if (tree.childBundles) {
    let children = Array.from(bundle.childBundles).sort(
      (a, b) =>
        Array.from(a.assets).sort()[0].basename <
        Array.from(b.assets).sort()[0].basename
          ? -1
          : 1
    );
    t.is(bundle.childBundles.size, tree.childBundles.length);
    tree.childBundles.forEach((b, i) => assertBundleTree(t, children[i], b));
  }

  if (/js|css/.test(bundle.type)) {
    t.true(fs.existsSync(bundle.name));
  }
}
