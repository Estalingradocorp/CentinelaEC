const zlib = require('zlib');
const fs = require('fs');

const S = 256;
function crc32(buf) {
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Colors
const bg = [10, 12, 20];           // dark navy
const ring = [0, 220, 130];        // green radar
const sweep = [0, 255, 170];
const dot = [255, 60, 60];         // red target

const px = Buffer.alloc(S * S * 4); // RGBA rows top->bottom

function setPx(x, y, c) {
  if (x < 0 || y < 0 || x >= S || y >= S) return;
  const i = (y * S + x) * 4;
  px[i] = c[0]; px[i+1] = c[1]; px[i+2] = c[2]; px[i+3] = 255;
}

const cx = S / 2, cy = S / 2;
for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    const dx = x - cx, dy = y - cy;
    const r = Math.sqrt(dx*dx + dy*dy);
    let c = bg;
    const ang = Math.atan2(dy, dx);
    // rings at radii
    for (const R of [52, 92, 122]) {
      const d = Math.abs(r - R);
      if (d < 2) c = mix(c, ring, 1 - d/2);
    }
    // cross lines
    if (Math.abs(dx) < 1.5 || Math.abs(dy) < 1.5) c = mix(c, ring, 0.35);
    // sweep arm from center (radar beam, lower half)
    if (r > 0 && r < 124) {
      const a = Math.atan2(dy, dx);
      const targetA = Math.PI / 2; // pointing down
      let diff = Math.abs(a - targetA);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (diff < 0.45) c = mix(c, sweep, (0.45 - diff) * 1.2 * (1 - r/124));
    }
    // target dot
    const tdx = 70, tdy = 55;
    const tr = Math.sqrt((x - (cx+tdx)) ** 2 + (y - (cy+tdy)) ** 2);
    if (tr < 7) c = mix(c, dot, 1 - tr/7);
    setPx(x, y, c);
  }
}

function mix(a, b, t) {
  return [Math.round(a[0]+(b[0]-a[0])*t), Math.round(a[1]+(b[1]-a[1])*t), Math.round(a[2]+(b[2]-a[2])*t)];
}

// build raw scanlines with filter byte 0
const raw = Buffer.alloc(S * (S * 4 + 1));
for (let y = 0; y < S; y++) {
  raw[y * (S*4+1)] = 0;
  px.copy(raw, y * (S*4+1) + 1, y * S * 4, (y+1) * S * 4);
}

const idat = zlib.deflateSync(raw);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // color type RGBA
const png = Buffer.concat([
  Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0))
]);

fs.writeFileSync('icon.png', png);
console.log('icon.png written', png.length, 'bytes');