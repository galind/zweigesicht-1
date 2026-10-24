// One client-side navigation intent. Reloads, bookmarks and Back never opt in.
let requestedAt = 0;
export function requestBenchEntry() {
  requestedAt = Date.now();
}
export function consumeBenchEntry() {
  const requested = requestedAt;
  requestedAt = 0;
  return requested > 0 && Date.now() - requested < 10000;
}
