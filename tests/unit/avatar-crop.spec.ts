import { expect, it } from 'vitest';
import { getAvatarCrop } from '../../client/components/auth/avatarCrop';

it('starts with a centered square and shifts wide or tall images without exposing the background', () => {
  expect(getAvatarCrop(800, 400, 1, { x: 0, y: 0 })).toEqual({ x: 200, y: 0, size: 400 });
  expect(getAvatarCrop(800, 400, 1, { x: -1, y: 1 })).toEqual({ x: 400, y: 0, size: 400 });
  expect(getAvatarCrop(400, 800, 1, { x: 1, y: 1 })).toEqual({ x: 0, y: 0, size: 400 });
});

it('zooms around the selection and clamps the crop even for an extreme panorama', () => {
  expect(getAvatarCrop(800, 400, 2, { x: 0, y: 0 })).toEqual({ x: 300, y: 100, size: 200 });
  expect(getAvatarCrop(800, 400, 2, { x: 0.1, y: -0.25 })).toEqual({ x: 280, y: 150, size: 200 });
  expect(getAvatarCrop(4000, 10, 2, { x: 1e8, y: -1e8 })).toEqual({ x: 0, y: 5, size: 5 });
});
