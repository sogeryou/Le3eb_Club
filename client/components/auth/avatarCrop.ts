export type CropOffset = { x: number; y: number };
export const AVATAR_OUTPUT_SIZE = 512;
export const AVATAR_MAX_ZOOM = 4;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function getAvatarCrop(width: number, height: number, zoom: number, offset: CropOffset) {
  const size = Math.min(width, height) / clamp(zoom, 1, AVATAR_MAX_ZOOM);
  const x = clamp((width - size) / 2 - offset.x * size, 0, width - size);
  const y = clamp((height - size) / 2 - offset.y * size, 0, height - size);
  return { x, y, size };
}

export function clampAvatarOffset(width: number, height: number, zoom: number, offset: CropOffset): CropOffset {
  const { x, y, size } = getAvatarCrop(width, height, zoom, offset);
  return { x: ((width - size) / 2 - x) / size, y: ((height - size) / 2 - y) / size };
}
