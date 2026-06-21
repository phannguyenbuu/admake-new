/**
 * Centralized Texture Loader with caching
 * Loads real image textures from public/textures/ directory
 */

import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();

/**
 * Load a texture from public/textures/ with caching and sensible defaults.
 * Returns the texture immediately (blank until async load completes).
 */
export function loadTexture(
  filename: string,
  repeatX = 1,
  repeatY = 1
): THREE.Texture {
  const cacheKey = `${filename}_${repeatX}_${repeatY}`;

  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const texture = textureLoader.load(`/textures/${filename.replace(/\.jpg$/, '.webp')}`);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = THREE.SRGBColorSpace;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Load a texture intended for bump/normal/roughness maps (linear color space)
 */
export function loadBumpTexture(
  filename: string,
  repeatX = 1,
  repeatY = 1
): THREE.Texture {
  const cacheKey = `bump_${filename}_${repeatX}_${repeatY}`;

  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const texture = textureLoader.load(`/textures/${filename.replace(/\.jpg$/, '.webp')}`);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = THREE.LinearSRGBColorSpace;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Dispose all cached textures (call on cleanup)
 */
export function disposeAllTextures(): void {
  textureCache.forEach((tex) => tex.dispose());
  textureCache.clear();
}
