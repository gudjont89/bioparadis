const PALETTE = [
  "#C24D2C", "#2C6E8A", "#8A5E2C", "#4A7C3F",
  "#6B3FA0", "#A03F5E", "#2C8A6E", "#5E6B3F",
  "#8A2C6E", "#3F6BA0", "#A07C3F", "#3FA07C",
  "#7C3FA0", "#A0503F", "#3F5EA0", "#6B8A2C",
];

/** Java's `String.hashCode()`, so colors match the old Android app. */
function javaHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return h;
}

export function colorForMovie(movieId: string): string {
  const index = (javaHash(movieId) & 0x7fffffff) % PALETTE.length;
  return PALETTE[index] as string;
}
