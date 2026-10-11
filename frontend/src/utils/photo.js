// Every photo in public/images/site and public/doctors also exists as WebP in two widths:
// photo.jpg -> photo-800.webp and photo-1400.webp (portraits: -400 and -800; the hero corridor: -800 and -1600).
// The browser picks the smallest one that is sharp enough for the screen, so phones download far less.
const WIDTHS = {
  site: [800, 1400],
  corridor: [800, 1600],
  doctors: [400, 800],
};

// <img {...responsivePhoto("/images/site/lab.jpg")} sizes="..." />
export const responsivePhoto = (path) => {
  const match = /^\/(images\/site|doctors)\/([\w-]+)\.jpg$/.exec(path || "");
  if (!match) return { src: path };
  const [, folder, name] = match;
  const [small, large] = folder === "doctors" ? WIDTHS.doctors : name === "corridor" ? WIDTHS.corridor : WIDTHS.site;
  const file = (width) => `/${folder}/${name}-${width}.webp`;
  return { src: file(small), srcSet: `${file(small)} ${small}w, ${file(large)} ${large}w` };
};

// The WebP portrait for a sample doctor; other photos (uploads, the API) are returned as they are
export const portraitUrl = (path) => {
  const match = /^\/doctors\/(doctor-\d+)\.jpg$/.exec(path || "");
  return match ? `/doctors/${match[1]}-800.webp` : path;
};
