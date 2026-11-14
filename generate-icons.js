const { writeFileSync, statSync } = require('fs');
const { deflateSync } = require('zlib');

function crc32(buf) {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const l = Buffer.alloc(4);
  const cr = Buffer.alloc(4);
  l.writeUInt32BE(data.length, 0);
  cr.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([l, t, data, cr]);
}

function makePNG(sz) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ih = Buffer.alloc(13);
  ih.writeUInt32BE(sz, 0);
  ih.writeUInt32BE(sz, 4);
  ih[8] = 8; ih[9] = 2;

  const rl = 1 + sz * 3;
  const raw = Buffer.alloc(sz * rl);
  for (let y = 0; y < sz; y++) {
    raw[y * rl] = 0;
    for (let x = 0; x < sz; x++) {
      const o = y * rl + 1 + x * 3;
      raw[o] = 0x11; raw[o + 1] = 0x11; raw[o + 2] = 0x11;
    }
  }

  function fill(x, y, w, h) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const px = x + dx, py = y + dy;
        if (px < 0 || px >= sz || py < 0 || py >= sz) continue;
        const o = py * rl + 1 + px * 3;
        raw[o] = 0xF5; raw[o + 1] = 0xF2; raw[o + 2] = 0xEC;
      }
    }
  }

  const s = Math.max(1, Math.floor(sz / 30));
  const tw = 25 * s;
  const ox = Math.floor((sz - tw) / 2);
  const oy = Math.floor(sz * 0.28);

  // S
  fill(ox, oy, 7 * s, s);
  fill(ox, oy, s, 3 * s);
  fill(ox, oy + 3 * s, 7 * s, s);
  fill(ox + 6 * s, oy + 4 * s, s, 3 * s);
  fill(ox, oy + 7 * s, 7 * s, s);

  // 2
  const ox2 = ox + 9 * s;
  fill(ox2, oy, 7 * s, s);
  fill(ox2 + 6 * s, oy, s, 3 * s);
  fill(ox2, oy + 3 * s, 7 * s, s);
  fill(ox2, oy + 4 * s, s, 3 * s);
  fill(ox2, oy + 7 * s, 7 * s, s);

  // G
  const ox3 = ox + 18 * s;
  fill(ox3, oy, 7 * s, s);
  fill(ox3, oy, s, 8 * s);
  fill(ox3, oy + 7 * s, 7 * s, s);
  fill(ox3 + 6 * s, oy + 4 * s, s, 4 * s);
  fill(ox3 + 3 * s, oy + 4 * s, 4 * s, s);

  return Buffer.concat([
    sig,
    chunk('IHDR', ih),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync('public/icons/apple-touch-icon.png', makePNG(180));
writeFileSync('public/icons/icon-192.png', makePNG(192));
writeFileSync('public/icons/icon-512.png', makePNG(512));

console.log('apple-touch-icon.png:', statSync('public/icons/apple-touch-icon.png').size, 'bytes');
console.log('icon-192.png:', statSync('public/icons/icon-192.png').size, 'bytes');
console.log('icon-512.png:', statSync('public/icons/icon-512.png').size, 'bytes');
