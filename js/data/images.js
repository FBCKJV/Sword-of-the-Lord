import { DEMONS } from './demons.js';

const KEYS = [...DEMONS.map(d => d.key), 'satan'].flatMap(key => [`${key}_laughing`, `${key}_struck`]);

export const IMAGES = {};

export function loadImages(onProgress){
  return new Promise(resolve => {
    let loaded = 0;
    KEYS.forEach(key => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        if (onProgress) onProgress(loaded, KEYS.length);
        if (loaded === KEYS.length) resolve();
      };
      img.src = `assets/demons/${key}.jpg`;
      IMAGES[key] = img;
    });
  });
}
