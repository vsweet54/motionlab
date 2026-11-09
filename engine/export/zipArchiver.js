/**
 * ZIP File Packager in pure JavaScript
 * Packages multiple files (e.g. PNG sequences) into a standard uncompressed PKZIP .zip file.
 */

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function calculateCrc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Creates an uncompressed ZIP Blob from an array of files.
 * @param {Array<{ name: string, data: Uint8Array|ArrayBuffer }>} files
 * @returns {Blob}
 */
export function createZipArchive(files) {
  const parts = [];
  const centralDirHeaders = [];
  let currentOffset = 0;

  for (const file of files) {
    const filenameBytes = new TextEncoder().encode(file.name);
    const fileData =
      file.data instanceof Uint8Array
        ? file.data
        : new Uint8Array(file.data);

    const crc = calculateCrc32(fileData);
    const size = fileData.length;

    // --- Local File Header (30 bytes + name) ---
    const localHeader = new Uint8Array(30 + filenameBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true); // Version needed (2.0)
    view.setUint16(6, 0, true); // General purpose bit flag
    view.setUint16(8, 0, true); // Compression method (0 = uncompressed store)
    view.setUint16(10, 0, true); // File last mod time
    view.setUint16(12, 0, true); // File last mod date
    view.setUint32(14, crc, true); // CRC-32
    view.setUint32(18, size, true); // Compressed size
    view.setUint32(22, size, true); // Uncompressed size
    view.setUint16(26, filenameBytes.length, true); // File name length
    view.setUint16(28, 0, true); // Extra field length
    localHeader.set(filenameBytes, 30);

    parts.push(localHeader);
    parts.push(fileData);

    // --- Central Directory Header (46 bytes + name) ---
    const centralHeader = new Uint8Array(46 + filenameBytes.length);
    const cView = new DataView(centralHeader.buffer);

    cView.setUint32(0, 0x02014b50, true); // Central directory header signature
    cView.setUint16(4, 20, true); // Version made by
    cView.setUint16(6, 20, true); // Version needed
    cView.setUint16(8, 0, true); // Flags
    cView.setUint16(10, 0, true); // Compression (0)
    cView.setUint16(12, 0, true); // Time
    cView.setUint16(14, 0, true); // Date
    cView.setUint32(16, crc, true); // CRC32
    cView.setUint32(20, size, true); // Compressed size
    cView.setUint32(24, size, true); // Uncompressed size
    cView.setUint16(28, filenameBytes.length, true); // File name length
    cView.setUint16(30, 0, true); // Extra field length
    cView.setUint16(32, 0, true); // Comment length
    cView.setUint16(34, 0, true); // Disk number start
    cView.setUint16(36, 0, true); // Internal attributes
    cView.setUint32(38, 0, true); // External attributes
    cView.setUint32(42, currentOffset, true); // Offset of local header
    centralHeader.set(filenameBytes, 46);

    centralDirHeaders.push(centralHeader);

    currentOffset += localHeader.length + size;
  }

  const centralDirStart = currentOffset;
  let centralDirSize = 0;
  for (const c of centralDirHeaders) {
    parts.push(c);
    centralDirSize += c.length;
  }

  // --- End of Central Directory Record (22 bytes) ---
  const eocd = new Uint8Array(22);
  const eView = new DataView(eocd.buffer);
  eView.setUint32(0, 0x06054b50, true); // EOCD signature
  eView.setUint16(4, 0, true); // Disk number
  eView.setUint16(6, 0, true); // Disk where central directory starts
  eView.setUint16(8, files.length, true); // Total records on disk
  eView.setUint16(10, files.length, true); // Total records
  eView.setUint32(12, centralDirSize, true); // Size of central directory
  eView.setUint32(16, centralDirStart, true); // Offset of central directory
  eView.setUint16(20, 0, true); // Comment length

  parts.push(eocd);

  return new Blob(parts, { type: "application/zip" });
}
