// Build a local-only evidence viewer. No source images or recordings enter Git.
import { readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const dir = resolve('artifacts/browser/polish');
const files = await readdir(dir);
const views = ['loading', 'ready', 'spread', 'options', 'catalog', 'search', 'fallback', 'error', 'details', 'selected'];
const pairs = views.flatMap(view => [1280,1600,390,320,844].map(width => ({view,width})))
  .filter(({view,width}) => files.includes(`after-${view}-${width}.png`));
const shots = pairs.map(({view,width}) => `<section><h2>${view} · ${width}px</h2><div class="pair">${['before','after'].map(stage => files.includes(`${stage}-${view}-${width}.png`) ? `<figure><figcaption>${stage}</figcaption><a href="${stage}-${view}-${width}.png"><img loading="lazy" src="${stage}-${view}-${width}.png" alt="${stage} ${view}, ${width} pixels wide"></a></figure>` : '').join('')}</div></section>`).join('');
const motions = [1280,390].flatMap(width => ['scrub','spread','interrupt'].map(kind => ({width,kind})))
  .filter(({width,kind}) => files.includes(`after-${kind}-${width}.json`));
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Zweigesicht · local polish review</title>
<style>body{margin:24px;background:#171717;color:#e0e0dc;font:16px/1.5 system-ui}h1,h2{font-family:Georgia}h2{font-size:23px}p{max-width:78ch}a{color:inherit}section{margin:44px 0;border-top:1px solid #444;padding-top:12px}.pair{display:flex;gap:16px;align-items:start}figure{margin:0;flex:1;min-width:0}figcaption{margin:8px 0;text-transform:capitalize}img{max-width:100%;max-height:720px;object-fit:contain;object-position:left top}button,input{min-height:44px}button{padding:6px 16px;margin-right:12px;background:#deded7;color:#181818;border:0;border-radius:5px}input{width:min(60vw,600px);vertical-align:middle}output{margin-left:12px}nav{display:flex;gap:24px;flex-wrap:wrap}@media(max-width:650px){.pair{flex-direction:column}figure{width:100%}}</style>
<h1>Zweigesicht · interface polish</h1><p>Local evidence from the real in-app browser. Baseline: a806295. Final: the local polish implementation. All model geometry, materials and lighting are preserved. Browser viewport emulation is not physical phone testing.</p><nav><a href="#motion">Motion comparisons</a><a href="#views">Matched views</a><a href="browser-checks-1280.json">Browser checks</a><a href="cpu-checks.json">Actual-asset checks</a></nav>
<h2 id="motion">Motion at recorded speed</h2><p>Play uses each recording’s actual timestamps. Frames were sampled approximately every 100 ms, so this shows the presentation path and timing, not full-rate rendering performance. Use the slider to inspect large plates, long shafts and tiny fittings during travel. Recordings and screenshots remain local.</p>
${motions.map(({width,kind})=>`<section id="${kind}-${width}" class="motion" data-kind="${kind}" data-width="${width}"><h2>${kind} · ${width}px</h2><button>Play comparison</button><input aria-label="${kind} ${width} time" type="range" min="0" max="4000" value="0" step="1"><output>0 ms</output><div class="pair">${['before','after'].map(stage=>`<figure><figcaption>${stage}</figcaption><img alt="${stage} ${kind} recording"></figure>`).join('')}</div></section>`).join('')}
<h2 id="views">Matched views</h2>${shots}<section><h2>Additional acceptance evidence</h2><ul>${files.filter(f=>/^(after-text200|after-section|after-fallback-details|after-pointer|graphics-recovering)/.test(f)&&f.endsWith('.png')).map(f=>`<li><a href="${f}">${f.replace('.png','').replaceAll('-',' ')}</a></li>`).join('')}</ul></section>
<script type="module">
for(const section of document.querySelectorAll('.motion')){
 const {kind,width}=section.dataset,button=section.querySelector('button'),slider=section.querySelector('input'),output=section.querySelector('output'),imgs=[...section.querySelectorAll('img')];let records,run=0;
 async function load(){if(!records){records=await Promise.all(['before','after'].map(stage=>fetch(stage+'-'+kind+'-'+width+'.json').then(r=>r.json())));}return records;}
 function paint(ms){records.forEach((r,i)=>{let frame=r.frames[0];for(const candidate of r.frames){if(candidate.ms>ms)break;frame=candidate;}imgs[i].src=frame.image;});slider.value=ms;output.textContent=Math.round(ms)+' ms';}
 slider.addEventListener('input',async()=>{run++;await load();paint(+slider.value);button.textContent='Play comparison';});
 button.addEventListener('click',async()=>{await load();const own=++run,start=performance.now();button.textContent='Playing';function tick(now){if(own!==run)return;const ms=Math.min(4000,now-start);paint(ms);if(ms<4000)requestAnimationFrame(tick);else button.textContent='Play comparison';}requestAnimationFrame(tick);});
 const observer=new IntersectionObserver(async entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();await load();paint(0);}});observer.observe(section);
}
</script></html>`;
await writeFile(resolve(dir,'index.html'),html);
console.log(`Built local gallery: ${pairs.length} view sets and ${motions.length} motion comparisons.`);
