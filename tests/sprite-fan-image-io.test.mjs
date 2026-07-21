import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../sprite-fan/src/image-io.js', import.meta.url), 'utf8');
const context = vm.createContext({});
context.globalThis = context;
vm.runInContext(source, context, { filename: 'image-io.js' });
const imageIo = context.SpriteFanImageIo;

assert.ok(imageIo, 'image I/O core should install itself in a classic-script context');

function fixture() {
  const events = [];
  const image = {};
  const urlApi = {
    createObjectURL(file) {
      events.push(['create', file]);
      return 'blob:sprite';
    },
    revokeObjectURL(url) {
      events.push(['revoke', url]);
    },
  };
  return { events, image, urlApi };
}

{
  const { events, image, urlApi } = fixture();
  const file = { name: 'hero.png' };
  const result = imageIo.loadObjectUrlImage(file, {
    urlApi,
    createImage: () => image,
    onLoad: (loaded) => events.push(['load', loaded]),
  });
  assert.equal(image.src, 'blob:sprite');
  image.onload();
  assert.deepEqual(events, [
    ['create', file],
    ['load', image],
    ['revoke', 'blob:sprite'],
  ]);
  assert.equal(result.release(), false, 'object URL should be released exactly once');
}

{
  const { events, image, urlApi } = fixture();
  imageIo.loadObjectUrlImage({ name: 'broken.png' }, {
    urlApi,
    createImage: () => image,
    onLoad: () => events.push(['unexpected-load']),
    onError: (event) => events.push(['error', event.type]),
  });
  image.onerror({ type: 'error' });
  assert.deepEqual(events.map((event) => event[0]), ['create', 'revoke', 'error']);
}

{
  const { events, image, urlApi } = fixture();
  imageIo.loadObjectUrlImage({ name: 'throws.png' }, {
    urlApi,
    createImage: () => image,
    onLoad: () => {
      throw new Error('consumer failed');
    },
  });
  assert.throws(() => image.onload(), /consumer failed/);
  assert.deepEqual(events.map((event) => event[0]), ['create', 'revoke']);
}

assert.throws(
  () => imageIo.loadObjectUrlImage({}, { urlApi: {}, createImage: () => ({}), onLoad: () => {} }),
  /object-URL API/,
);
assert.throws(
  () => imageIo.loadObjectUrlImage({}, {
    urlApi: { createObjectURL() {}, revokeObjectURL() {} },
    createImage: () => ({}),
  }),
  /onLoad/,
);

{
  const { events, urlApi } = fixture();
  assert.throws(
    () => imageIo.loadObjectUrlImage({}, {
      urlApi,
      createImage: () => {
        throw new Error('image constructor failed');
      },
      onLoad: () => {},
    }),
    /constructor failed/,
  );
  assert.deepEqual(events.map((event) => event[0]), ['create', 'revoke']);
}

{
  const { events, urlApi } = fixture();
  const image = {
    set src(_value) {
      throw new Error('src assignment failed');
    },
  };
  assert.throws(
    () => imageIo.loadObjectUrlImage({}, {
      urlApi,
      createImage: () => image,
      onLoad: () => {},
    }),
    /src assignment failed/,
  );
  assert.deepEqual(events.map((event) => event[0]), ['create', 'revoke']);
}

console.log('sprite fan image I/O contract OK');
