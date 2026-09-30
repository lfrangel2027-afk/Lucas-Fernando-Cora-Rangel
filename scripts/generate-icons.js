import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPng(size, isMaskable = false) {
  const width = size;
  const height = size;

  // Each scanline: 1 byte filter (0) + width * 4 bytes (RGBA)
  const rawData = Buffer.alloc(height * (1 + width * 4));

  const center = size / 2;
  const radius = isMaskable ? size * 0.40 : size * 0.44;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: slate-950 (#020617) -> (2, 6, 23, 255)
      let r = 15;
      let g = 23;
      let b = 42;
      let a = 255;

      // Circle badge in center: amber (#f59e0b) -> (245, 158, 11)
      if (dist < radius) {
        // Inner rounded box icon:
        const boxSize = radius * 0.65;
        const inBox = Math.abs(dx) < boxSize && Math.abs(dy) < boxSize;
        if (inBox) {
          // Box lid / ribbon effect:
          const isRibbon = Math.abs(dx) < boxSize * 0.22 || Math.abs(dy) < boxSize * 0.22;
          if (isRibbon) {
            r = 251; g = 191; b = 36; // Amber-400
          } else {
            r = 217; g = 119; b = 6;  // Amber-600
          }
        } else {
          r = 245; g = 158; b = 11; // Amber-500 badge
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: deflate
  ihdr[11] = 0; // Filter: basic
  ihdr[12] = 0; // Interlace: non-interlaced

  const idatData = zlib.deflateSync(rawData);

  const pngBuffer = Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idatData),
    makeChunk('IEND', Buffer.alloc(0))
  ]);

  return pngBuffer;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64, false));

console.log('PNG Icons generated successfully in public/');
