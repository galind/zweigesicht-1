// Check initial HTTP HTML without executing client JavaScript.
// node scripts/check-seo.mjs [local origin]
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
const get = async (path, userAgent = 'Twitterbot') => {
  const response = await fetch(new URL(path, base), {
    headers: { 'User-Agent': userAgent },
  });
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
      `${origin}/images/zweigesicht-1-separated-71ba2d171225.jpg`,
    );
  }
  assert.equal(meta('og:url'), `${origin}/`);
  assert.equal(meta('og:type'), 'website');
  assert.equal(meta('og:image:width'), '2560');
  assert.equal(meta('og:image:height'), '1440');
  assert.equal(meta('og:image:type'), 'image/jpeg');
  assert.ok(meta('og:image:alt'));
  assert.equal(meta('twitter:image:alt'), meta('og:image:alt'));
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
// Social crawlers read the initial head, not client-rendered metadata. Nested
// route metadata must retain the image and large-card fields on Workshop.
for (const userAgent of [
  'Twitterbot',
  'facebookexternalhit/1.1',
  'LinkedInBot/1.0',
]) {
  for (const path of [
    '/',
    '/?utm_source=share',
    '/workshop',
    '/workshop?mode=hard&utm_source=share',
  ]) {
    const raw = await get(path, userAgent);
    const head = raw.split('</head>')[0];
    const tags = [...head.matchAll(/<(?:meta|link)\b([^>]+)>/g)].map(
      ([, attrs]) =>
        Object.fromEntries(
          [...attrs.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [
            key,
            decode(value),
          ]),
        ),
    );
    const meta = (key) => {
      const matches = tags.filter(
        (tag) => tag.name === key || tag.property === key,
      );
      assert.equal(
        matches.length,
        1,
        `${path}: exactly one ${key} in initial head`,
      );
      return matches[0].content;
    };
    const workshop = path.startsWith('/workshop');
    const expectedTitle = workshop
      ? 'Workshop — Assemble Zweigesicht-1'
      : title;
    const expectedDescription = workshop
      ? 'Assemble the Zweigesicht-1 movement in Easy or Hard mode using the original ML-01 components.'
      : description;
    const url = `${origin}${workshop ? '/workshop' : '/'}`;
    const canonicals = tags.filter((tag) => tag.rel === 'canonical');
    assert.equal(canonicals.length, 1);
    assert.equal(canonicals[0].href, url);
    assert.equal(meta('og:url'), url);
    assert.equal(meta('og:type'), 'website');
    assert.equal(meta('og:site_name'), 'Marco Lang Zweigesicht-1');
    assert.equal(meta('description'), expectedDescription);
    assert.equal(
      decode(head.match(/<title>([^<]+)<\/title>/)?.[1] || ''),
      expectedTitle,
    );
    for (const prefix of ['og', 'twitter']) {
      assert.equal(meta(`${prefix}:title`), expectedTitle);
      assert.equal(meta(`${prefix}:description`), expectedDescription);
      assert.equal(
        meta(`${prefix}:image`),
        `${origin}/images/zweigesicht-1-separated-71ba2d171225.jpg`,
      );
      assert.equal(
        meta(`${prefix}:image:alt`),
        'Exploded CAD view of the Zweigesicht-1 Calibre ML-01 movement with authored surface finishes',
      );
    }
    assert.equal(meta('og:image:width'), '2560');
    assert.equal(meta('og:image:height'), '1440');
    assert.equal(meta('og:image:type'), 'image/jpeg');
    assert.equal(meta('twitter:card'), 'summary_large_image');
    if (workshop) {
      assert.match(meta('robots'), /noindex/);
      assert.match(meta('robots'), /nofollow/);
    }
    console.log(
      `PASS ${userAgent} ${path}: complete social card in initial head`,
    );
  }
}
for (const path of ['/play', '/play?mode=hard&utm_source=share']) {
  const response = await fetch(new URL(path, base), { redirect: 'manual' });
  assert.ok(
    [301, 308].includes(response.status),
    `${path}: permanent redirect`,
  );
  const destination = new URL(response.headers.get('location'), base);
  assert.equal(destination.pathname, '/workshop');
  assert.equal(destination.search, new URL(path, base).search);
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
  new URL('/images/zweigesicht-1-separated-71ba2d171225.jpg', base),
);
assert.equal(image.status, 200);
assert.match(image.headers.get('content-type'), /image\/jpeg/);
const imageBytes = Buffer.from(await image.arrayBuffer());
assert.equal(imageBytes.byteLength, 238639);
assert.equal(
  createHash('sha256').update(imageBytes).digest('hex'),
  '71ba2d17122578edad6cbecdac4685158cec38a40c837ecf1cdfa211dddff970',
  'social image matches the user-supplied capture',
);
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
  'PASS robots, homepage-only sitemap, current social image hash and removed routes/assets',
);
