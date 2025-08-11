export const BOXER_PREFIXES = {
  P1: 'boxer1',
  P2: 'boxer2',
};

export function animKey(prefix, name) {
  return `${prefix}_${name}`;
}

// Format a numeric amount into a dollar string with space separated thousands
// e.g. 5000000 -> "$5 000 000". Returns '-' if amount is null or undefined.
export function formatMoney(amount) {
  if (amount == null) return '-';
  return `$${amount
    .toLocaleString('sv-SE')
    .replace(/\u00A0/g, ' ')}`;
}

// Create a new texture where pure white pixels become fully transparent.
// Returns the key of the new texture so it can be used when creating images.
// If the texture was already processed it simply returns the previously
// generated key. This allows title belt graphics to have their white
// backgrounds removed wherever they are displayed.
export function makeWhiteTransparent(scene, key) {
  if (!scene?.textures) return key;
  const tex = scene.textures.get(key);
  if (!tex) return key;
  const newKey = `${key}_transparent`;
  if (scene.textures.exists(newKey)) return newKey;
  const src = tex.getSourceImage();
  const canvasTex = scene.textures.createCanvas(newKey, src.width, src.height);
  const ctx = canvasTex.getContext();
  ctx.drawImage(src, 0, 0);
  const imgData = ctx.getImageData(0, 0, src.width, src.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  canvasTex.refresh();
  return newKey;
}
