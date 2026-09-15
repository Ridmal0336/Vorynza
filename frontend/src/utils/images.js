/**
 * Halls store photos as a single comma/newline separated `imageUrls` string, which the
 * seed data leaves empty. Anything missing falls back to a stable Unsplash venue photo
 * so the layout never collapses.
 */

const UNSPLASH_IDS = [
  'photo-1519741497674-611481863552',
  'photo-1464366400600-7168b8af9bc3',
  'photo-1470217957101-da7150b9b681',
  'photo-1511285560929-80b456fea0bc',
  'photo-1520854221256-17451cc331bf',
  'photo-1478146896981-b80fe463b330',
  'photo-1519225421980-715cb0215aed',
  'photo-1583939003579-730e3918a45a',
  'photo-1522413452208-996ff3f3e740',
  'photo-1507504031003-b417219a0fde',
];

export function unsplash(id, width = 1200) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
}

/** Deterministic photo for a given entity so images stay stable across renders. */
export function fallbackImage(seed = 0, width = 1200) {
  const index = Math.abs(Number(seed) || 0) % UNSPLASH_IDS.length;
  return unsplash(UNSPLASH_IDS[index], width);
}

export function parseImageUrls(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[\n,;|]+/)
    .map((part) => part.trim())
    .filter((part) => /^https?:\/\//i.test(part));
}

/** Always returns at least one usable image URL. */
export function galleryFor(entity, count = 3) {
  const parsed = parseImageUrls(entity?.imageUrls);
  if (parsed.length > 0) return parsed;

  const seed = Number(entity?.id) || 0;
  return Array.from({ length: count }, (_, offset) =>
    fallbackImage(seed + offset * 3, 1600)
  );
}

export function coverFor(entity, width = 1200) {
  const parsed = parseImageUrls(entity?.imageUrls ?? entity?.imageUrl);
  return parsed[0] || fallbackImage(entity?.id, width);
}
