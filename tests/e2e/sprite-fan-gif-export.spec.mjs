import { expect, test } from '@playwright/test';

function readU16(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

async function longGifPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 40, 20);
    ctx.fillStyle = 'rgba(70, 140, 230, 1)';
    ctx.fillRect(2, 2, 16, 16);
    ctx.fillStyle = 'rgba(230, 120, 70, 1)';
    ctx.fillRect(22, 2, 16, 16);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-long-gif-export.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

function parseGif(bytes) {
  const ascii = (start, len) => String.fromCharCode(...bytes.slice(start, start + len));
  const info = {
    header: ascii(0, 6),
    width: readU16(bytes, 6),
    height: readU16(bytes, 8),
    loopCount: null,
    frameCount: 0,
    delays: [],
    transparentFrames: 0,
    imageDescriptors: [],
    trailer: bytes[bytes.length - 1],
  };
  let offset = 13;
  const globalTableFlag = (bytes[10] & 0x80) !== 0;
  if (globalTableFlag) offset += 3 * (2 ** ((bytes[10] & 0x07) + 1));

  while (offset < bytes.length) {
    const marker = bytes[offset++];
    if (marker === 0x3b) break;
    if (marker === 0x21) {
      const label = bytes[offset++];
      if (label === 0xff) {
        const blockSize = bytes[offset++];
        const app = ascii(offset, blockSize);
        offset += blockSize;
        while (bytes[offset] !== 0) {
          const size = bytes[offset++];
          if (app === 'NETSCAPE2.0' && size >= 3 && bytes[offset] === 1) {
            info.loopCount = readU16(bytes, offset + 1);
          }
          offset += size;
        }
        offset++;
      } else if (label === 0xf9) {
        const size = bytes[offset++];
        const packed = bytes[offset];
        const delay = readU16(bytes, offset + 1);
        const transparent = (packed & 1) === 1;
        info.delays.push(delay);
        if (transparent) info.transparentFrames += 1;
        offset += size;
        expect(bytes[offset++]).toBe(0);
      } else {
        while (bytes[offset] !== 0) offset += 1 + bytes[offset];
        offset++;
      }
    } else if (marker === 0x2c) {
      const x = readU16(bytes, offset);
      const y = readU16(bytes, offset + 2);
      const w = readU16(bytes, offset + 4);
      const h = readU16(bytes, offset + 6);
      const packed = bytes[offset + 8];
      offset += 9;
      if ((packed & 0x80) !== 0) offset += 3 * (2 ** ((packed & 0x07) + 1));
      offset++; // LZW minimum code size
      while (bytes[offset] !== 0) offset += 1 + bytes[offset];
      offset++;
      info.frameCount += 1;
      info.imageDescriptors.push({ x, y, w, h });
    } else {
      throw new Error(`unexpected GIF marker 0x${marker.toString(16)} at ${offset - 1}`);
    }
  }
  return info;
}

async function gifPayload(page) {
  const dataUrl = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 16, 8);
    ctx.fillStyle = 'rgba(70, 140, 230, 1)';
    ctx.fillRect(1, 1, 5, 5);
    ctx.fillStyle = 'rgba(230, 120, 70, 1)';
    ctx.fillRect(9, 1, 5, 5);
    return canvas.toDataURL('image/png');
  });
  return {
    name: 'sprite-fan-gif-export.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  };
}

async function readDownloadBytes(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Array.from(Buffer.concat(chunks));
}

test('GIF export preserves frame count, duration, transparency flag, and loop metadata', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await gifPayload(page));
  await page.locator('#frame-w-num').fill('8');
  await page.locator('#frame-h-num').fill('8');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('2 frames');

  await page.locator('button[data-wf="export"]').click();
  await page.locator('#manifest-name').fill('gif-check');
  await page.locator('#manifest-fps').evaluate((el) => {
    el.value = '10';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#manifest-loop').fill('4');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#btn-export-gif').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('gif-check.gif');

  const bytes = await readDownloadBytes(download);
  const info = parseGif(bytes);
  expect(info).toMatchObject({
    header: 'GIF89a',
    width: 8,
    height: 8,
    frameCount: 2,
    loopCount: 4,
    trailer: 0x3b,
  });
  expect(info.delays).toEqual([10, 10]);
  expect(info.transparentFrames).toBe(2);
  expect(info.imageDescriptors).toEqual([
    { x: 0, y: 0, w: 8, h: 8 },
    { x: 0, y: 0, w: 8, h: 8 },
  ]);
});

test('GIF export remains browser-decodable for frames larger than one 9-bit LZW block', async ({ page }) => {
  await page.goto('/sprite-fan/atlas-studio.html');
  await page.locator('#file-input').setInputFiles(await longGifPayload(page));
  await page.locator('#frame-w-num').fill('20');
  await page.locator('#frame-h-num').fill('20');
  await page.locator('#btn-slice').click();
  await expect(page.locator('#slice-info')).toContainText('2 frames');

  await page.locator('button[data-wf="export"]').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#btn-export-gif').click();
  const bytes = await readDownloadBytes(await downloadPromise);
  const dataUrl = `data:image/gif;base64,${Buffer.from(bytes).toString('base64')}`;

  const decoded = await page.evaluate(async (source) => {
    const image = new Image();
    image.src = source;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const center = Array.from(context.getImageData(10, 10, 1, 1).data);
    return { width: image.width, height: image.height, center };
  }, dataUrl);

  expect(decoded).toMatchObject({ width: 20, height: 20 });
  expect(decoded.center[3]).toBe(255);
});
