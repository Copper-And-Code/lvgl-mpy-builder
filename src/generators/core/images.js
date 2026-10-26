// Images uploaded in the Asset Manager are embedded in the generated code as
// the original PNG/JPEG bytes in an lv_image_dsc_t; LVGL decodes them at run
// time (lodepng for PNG, tjpgd for JPEG), in C as in MicroPython.

/**
 * Decode a base64 data URL.
 * @returns {{ mime: string, base64: string, bytes: Uint8Array } | null}
 */
export function parseDataUrl(url) {
  const match = /^data:([^;,]+)(?:;[^,]*)?;base64,([A-Za-z0-9+/=\s]*)$/.exec(String(url ?? ''));
  if (!match) return null;
  const base64 = match[2].replace(/\s+/g, '');
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { mime: match[1].toLowerCase(), base64, bytes };
  } catch {
    return null;
  }
}

const be16 = (bytes, i) => (bytes[i] << 8) | bytes[i + 1];
const be32 = (bytes, i) => ((bytes[i] << 24) >>> 0) + (bytes[i + 1] << 16) + (bytes[i + 2] << 8) + bytes[i + 3];

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
// Start-of-frame markers (baseline, progressive, ...), not DHT/JPG/DAC
const JPEG_SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

/**
 * Format and size of a PNG or JPEG file.
 * @returns {{ format: 'png'|'jpeg', width: number, height: number } | null}
 */
export function imageInfo(bytes) {
  if (bytes.length >= 24 && PNG_SIGNATURE.every((value, i) => bytes[i] === value)) {
    return { format: 'png', width: be32(bytes, 16), height: be32(bytes, 20) };
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) return null;
      const marker = bytes[i + 1];
      if (marker === 0xff) {
        i += 1; // fill byte
        continue;
      }
      if (JPEG_SOF.has(marker)) {
        return { format: 'jpeg', width: be16(bytes, i + 7), height: be16(bytes, i + 5) };
      }
      if (marker === 0xda || marker === 0xd9) return null; // scan data or end before a frame header
      i += 2 + be16(bytes, i + 2);
    }
  }
  return null;
}

/** C initializer lines for a byte array, `perLine` bytes per line. */
export function cByteLines(bytes, perLine = 16) {
  const lines = [];
  for (let i = 0; i < bytes.length; i += perLine) {
    const chunk = Array.from(bytes.subarray(i, i + perLine), (b) => '0x' + b.toString(16).padStart(2, '0'));
    lines.push(chunk.join(', ') + ',');
  }
  return lines;
}
