/** Convert private originals into lossless runtime GLBs; never copy STLs to public/. */
process.argv.push('--local');
await import('../assets/prepare-holders.mjs');
