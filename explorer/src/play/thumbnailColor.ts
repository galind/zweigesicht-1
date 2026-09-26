// WebGL render targets contain working-space (linear-sRGB) bytes. The main
// canvas receives Three's display transform, but readRenderTargetPixels does
// not. Encode those bytes before putting them in an ordinary browser canvas;
// otherwise metallic thumbnail midtones are interpreted as sRGB and appear
// almost black.
const displayByte = Uint8Array.from({ length: 256 }, (_, byte) => {
  const linear = byte / 255;
  const display =
    linear <= 0.0031308
      ? linear * 12.92
      : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, display)) * 255);
});

export function encodeThumbnailForDisplay(pixels: Uint8Array) {
  for (let index = 0; index < pixels.length; index += 4) {
    pixels[index] = displayByte[pixels[index]];
    pixels[index + 1] = displayByte[pixels[index + 1]];
    pixels[index + 2] = displayByte[pixels[index + 2]];
  }
}
