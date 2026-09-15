// Check initial HTTP HTML without executing client JavaScript.
// node scripts/check-seo.mjs [local origin]
import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://127.0.0.1:4173';
const origin = 'https://zweigesicht-1.guillemgalindo.com';
const title = 'Marco Lang Zweigesicht-1 — Interactive ML-01 Movement';
const description =
  "Explore Marco Lang's Zweigesicht-1 and Calibre ML-01 in an interactive 3D movement viewer. Inspect its components, construction and movement architecture.";
const decode = (text) =>
  text
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');
const get = async (path) => {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, `${path} status`);
  assert.doesNotMatch(response.headers.get('x-robots-tag') || '', /noindex/i);
  return response.text();
};
for (const path of ['/', '/?no3d=1&part=unknown']) {
  const raw = await get(path);
  const html = raw.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  const tags = [...html.matchAll(/<(?:meta|link)\b([^>]+)>/g)].map(
    ([, attrs]) =>
      Object.fromEntries(
        [...attrs.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, k, v]) => [
          k,
          decode(v),
        ]),
      ),
  );
  const meta = (key) =>
    tags.find((tag) => tag.name === key || tag.property === key)?.content;
  assert.equal(decode(html.match(/<title>([^<]+)<\/title>/)?.[1] || ''), title);
  assert.equal(meta('description'), description);
  assert.equal(tags.find((tag) => tag.rel === 'canonical')?.href, `${origin}/`);
  assert.doesNotMatch(meta('robots') || '', /noindex/i);
  for (const prefix of ['og', 'twitter']) {
    assert.equal(meta(`${prefix}:title`), title);
    assert.equal(meta(`${prefix}:description`), description);
    assert.equal(
      meta(`${prefix}:image`),
      `${origin}/images/marco-lang-ml01-movement.webp`,
    );
  }
  assert.equal(meta('og:url'), `${origin}/`);
  assert.equal(meta('twitter:card'), 'summary_large_image');
  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
  assert.equal(headings.length, 1);
  assert.equal(headings[0][1], 'Zweigesicht-1');
  assert.doesNotMatch(
    html,
    /<table\b|#view=|Technical specifications|Technical reference|reference-nav/i,
  );
  assert.ok(
    html.includes('href="https://www.marcolangwatches.com/en/main-page/"'),
  );
  assert.ok(html.includes('Learn about the watch'));
  // CAD links are inside the reading panel, mounted only when opened.
  assert.doesNotMatch(html, /<footer\b/i);
  const schema = JSON.parse(
    raw.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1],
  );
  assert.deepEqual(
    schema['@graph'].map((item) => item['@type']),
    ['WebSite', 'WebApplication'],
  );
  assert.equal(schema['@graph'][0].name, title);
  assert.equal(schema['@graph'][1].creator, undefined);
  const summary = schema['@graph'][1].description;
  for (const term of [
    'Marco Lang',
    'Zweigesicht-1',
    'Calibre ML-01',
    'publicly released CAD',
    'construction',
    'interpretations',
    'not affiliated',
  ]) {
    assert.ok(
      summary.includes(term),
      `initial structured description: ${term}`,
    );
  }
  console.log(
    `PASS ${path}: initial metadata, H1, schema and maker links; no footer`,
  );
}
const robots = await get('/robots.txt');
assert.match(robots, /User-agent: \*/i);
assert.match(robots, /Allow: \//i);
assert.ok(robots.includes(`${origin}/sitemap.xml`));
const sitemap = await get('/sitemap.xml');
assert.deepEqual(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]),
  [`${origin}/`],
);
const image = await fetch(
  new URL('/images/marco-lang-ml01-movement.webp', base),
);
assert.equal(image.status, 200);
assert.match(image.headers.get('content-type'), /image\/webp/);
assert.equal((await image.arrayBuffer()).byteLength, 52226);
for (const path of [
  '/movement/',
  '/movement/shock-indicator/',
  '/finishing/',
  '/sources/',
  '/movement/not-a-component/',
  '/images/ml01-balance-assembly.webp',
  '/images/zweigesicht-1-shock-indicator.webp',
]) {
  assert.equal(
    (await fetch(new URL(path, base))).status,
    404,
    `${path} removed`,
  );
}
console.log(
  'PASS robots, homepage-only sitemap, one social image and removed routes/assets',
);
