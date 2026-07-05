import { DEMONS } from './demons.js';

const KEYS = [...DEMONS.map(d => d.key), 'satan'].flatMap(key => [`${key}_laughing`, `${key}_struck`]);

// Raw <img> elements (used for the framed portrait on the level screen).
export const IMAGES = {};
// Processed canvases for in-battle drawing: the JPEG's rectangular painted
// background is feathered out with an elliptical alpha mask so the demon
// melts into the arena instead of floating on a visible card.
export const SPRITES = {};

function makeSprite(img, bandFade){
  const w = img.naturalWidth, h = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');

  // Slight punch-up so the crops read better against the dark arena.
  try { g.filter = 'contrast(1.07) saturate(1.12)'; } catch(e){}
  g.drawImage(img, 0, 0);
  g.filter = 'none';

  // Elliptical feather: keep the middle solid, fade the outer band to
  // transparent. Scaling the context turns the radial gradient into an
  // ellipse matched to the crop's aspect ratio.
  g.globalCompositeOperation = 'destination-in';
  g.save();
  g.translate(w/2, h/2);
  g.scale(1, h/w);
  const r = w/2;
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, r);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(0.62, 'rgba(0,0,0,1)');
  grad.addColorStop(0.88, 'rgba(0,0,0,0.45)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(-w/2, -w/2, w, w);
  g.restore();

  // Second mask pass for the six regular demons: their sheet crops have a
  // pose caption ("LAUGHING"/"STRUCK") baked into the top ~16% and a name
  // band at the very bottom, with the art starting around 31% — so hard-cut
  // both bands. Satan's crop has wings reaching the top edge (no cut there)
  // and only a small corner caption the elliptical mask already removes.
  // Must be a SINGLE full-canvas fill: destination-in erases everything
  // outside the drawn source, so a partial-rect fill would wipe the rest.
  if(bandFade){
    const bands = g.createLinearGradient(0, 0, 0, h);
    bands.addColorStop(0, 'rgba(0,0,0,0)');
    bands.addColorStop(0.20, 'rgba(0,0,0,0)');
    bands.addColorStop(0.28, 'rgba(0,0,0,1)');
    bands.addColorStop(0.86, 'rgba(0,0,0,1)');
    bands.addColorStop(0.94, 'rgba(0,0,0,0)');
    bands.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = bands;
    g.fillRect(0, 0, w, h);
  }

  g.globalCompositeOperation = 'source-over';
  return c;
}

export function loadImages(onProgress){
  return new Promise(resolve => {
    let loaded = 0;
    KEYS.forEach(key => {
      const img = new Image();
      img.onload = () => {
        try { SPRITES[key] = makeSprite(img, !key.startsWith('satan')); }
        catch(e){ SPRITES[key] = img; } // fall back to the raw image
        loaded++;
        if (onProgress) onProgress(loaded, KEYS.length);
        if (loaded === KEYS.length) resolve();
      };
      img.src = `assets/demons/${key}.jpg`;
      IMAGES[key] = img;
    });
  });
}
