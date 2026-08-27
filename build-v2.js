// KRN COA site v2 generator — run `node build-v2.js` from krn-coa-site/.
// Regenerates index.html + per-compound pages from DATA. URLs and PDF filenames
// are load-bearing (printed QR codes) — never change paths.
// Labs are data-driven: future lots from other laboratories (e.g. the planned
// Australian platform) are new entries in a lot's certs[] array.

const fs = require("fs");

const REGISTER_URL = "https://www.krnpeptides.com";

const LABS = {
  postech: { name: "POSTECH", full: "Pohang University of Science and Technology", country: "KOREA" },
  freedom: { name: "FREEDOM DIAGNOSTICS", full: "FreedomDiagnosticsTesting.com", country: "USA" },
};

// Shared KR panel facts for lot 26078 (identical across compounds; per-compound fields below)
const KR26078 = {
  lab: "postech",
  prepared: "2026-03-28", approved: "2026-03-30",
  puritySpec: "≥ 97 %",
  endotoxin: ["Endotoxin", "< 10 EU/mg", "Complies"],
  microbial: [["Total bacteria count", "< 10 CFU", "Complies"], ["Mold and yeast count", "< 10 CFU", "Complies"]],
  preservative: "5-organism panel (E. coli, P. aeruginosa, S. aureus, C. albicans, A. brasiliensis) · required Log₁₀ reduction criteria met through day 30",
};
const US26078 = {
  lab: "freedom",
  received: "2026-06-18", reported: "2026-06-21",
  endotoxin: "LAL assay per USP <85> · 2 replicates · Pass (sensitivity ≤ 0.05 EU/mL)",
  microbial: "PCR panel · no detectable microbial DNA · Pass",
  identity: "Confirmed (LC-MS)",
};

const COMPOUNDS = [
  {
    slug: "wolverine", name: "WOLVERINE", c: "#C6F52B", cDark: false,
    contents: "BPC-157 / TB-500", dose: "20MG", code: "W20mg",
    kr: { ...KR26078, appearance: "Clear, colorless liquid, free from visible foreign particles", ph: "4.8", phSpec: "4.5 – 5.5", purity: "99 %" },
    us: { ...US26078, purity: "99.38%", accession: "2606180055", search: "Stac2606180055", appearance: "Clear liquid" },
    headline: "99.38%",
  },
  {
    slug: "nad", name: "NAD+", c: "#9B7FE8", cDark: false,
    contents: "Nicotinamide adenine dinucleotide", dose: "500MG", code: "N500mg",
    kr: { ...KR26078, appearance: "Clear, colorless to yellow liquid, free from visible foreign particles", ph: "5.2", phSpec: "4.7 – 5.3", purity: "99 %" },
    us: { ...US26078, purity: "99.99%", accession: "2606180052", search: "Stac2606180052", appearance: "Clear liquid" },
    headline: "99.99%",
  },
  {
    slug: "glow", name: "GLOW", c: "#F048A8", cDark: false,
    contents: "BPC-157 / TB-500 / GHK-Cu", dose: "70MG", code: "G70mg",
    kr: { ...KR26078, appearance: "Clear, colorless to blue liquid, free from visible foreign particles", ph: "5.3", phSpec: "4.5 – 5.5", purity: "99 %" },
    us: null,
    ref: { lot: "26142", purity: "99.79%", reported: "2026-07-08", pdf: "reference-us-lot-26142.pdf" },
    headline: "99 %",
  },
  {
    slug: "klow", name: "KLOW", c: "#E2478F", cDark: false,
    contents: "BPC-157 / TB-500 / GHK-Cu / KPV", dose: "80MG", code: "K80mg",
    kr: { ...KR26078, appearance: "Clear, colorless to blue liquid, free from visible foreign particles", ph: "5.4", phSpec: "5.0 – 5.5", purity: "99 %" },
    us: { ...US26078, purity: "99.81%", accession: "2606180074", search: "Stac2606180074", appearance: "Blue liquid" },
    headline: "99.81%",
  },
];

const CSS = `
@font-face{font-family:'Archivo VF';src:url('/assets/fonts/Archivo-VF.ttf') format('truetype-variations');font-weight:100 900;font-stretch:62% 125%;font-display:swap}
@font-face{font-family:'Geist Mono VF';src:url('/assets/fonts/GeistMono-VF.ttf') format('truetype-variations');font-weight:100 900;font-display:swap}
@font-face{font-family:'Noto Sans KR Sub';src:url('/assets/fonts/NotoSansKR-sub.ttf') format('truetype');font-weight:900;font-display:swap}
:root{--ink:#000;--noir:#0A0A0A;--panel:#121212;--line:#2A2A28;--bone:#F2F1ED;--dim:#8F8D88;--dim2:#C6C3B8;--volt:#C6F52B}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--noir);color:var(--bone);font-family:'Archivo VF',system-ui,sans-serif;font-variation-settings:'wdth' 100,'wght' 430;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.kr{font-family:'Noto Sans KR Sub',sans-serif;font-weight:900}
.mono{font-family:'Geist Mono VF',monospace}
a{color:inherit;text-decoration:none}
.display{font-family:'Archivo VF',sans-serif;font-stretch:125%;font-variation-settings:'wdth' 125,'wght' 900;font-weight:900;text-transform:uppercase;line-height:.95}
.wrap{max-width:920px;margin:0 auto;padding:clamp(36px,6vw,64px) clamp(18px,4vw,28px) 64px}
.brandbar{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:clamp(30px,5vw,48px)}
.brandbar img{height:26px;width:auto}
.brandbar .tag{font-family:'Geist Mono VF',monospace;font-weight:700;font-size:10px;letter-spacing:.12em;text-transform:uppercase;background:var(--volt);color:var(--ink);padding:5px 10px}
h1.display{font-size:clamp(34px,6.5vw,58px)}
.sub{margin-top:14px;color:var(--dim2);font-size:15.5px;line-height:1.6;max-width:560px}
.statbar{display:flex;flex-wrap:wrap;border:3px solid var(--bone);margin-top:clamp(24px,4vw,36px)}
.statbar .cell{flex:1 1 180px;border-right:2px solid var(--line);padding:14px 16px;font-family:'Geist Mono VF',monospace;text-transform:uppercase}
.statbar .cell:last-child{border-right:0}
.statbar .cell b{display:block;font-size:15px;font-weight:800;color:var(--volt)}
.statbar .cell span{font-size:9px;font-weight:600;letter-spacing:.1em;color:var(--dim)}
.rows{margin-top:clamp(26px,4vw,40px);border:3px solid var(--bone)}
.crow{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;padding:16px 18px;border-bottom:2px solid var(--line);transition:background .12s,color .12s}
.crow:last-child{border-bottom:0}
.crow .dot{width:13px;height:13px;border:2.5px solid var(--bone);flex:0 0 auto}
.crow .n{font-family:'Archivo VF',sans-serif;font-stretch:125%;font-variation-settings:'wdth' 125,'wght' 900;font-weight:900;font-size:clamp(17px,2.6vw,22px);text-transform:uppercase}
.crow .c{color:var(--dim);font-family:'Geist Mono VF',monospace;font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;flex:1 1 200px}
.crow .p{font-family:'Geist Mono VF',monospace;font-weight:800;font-size:12px;letter-spacing:.05em;color:var(--volt)}
.crow .go{font-family:'Geist Mono VF',monospace;font-weight:800;font-size:10px;letter-spacing:.1em;background:var(--volt);color:var(--ink);padding:4px 9px}
a.crow:hover{background:var(--bone);color:var(--ink)}
a.crow:hover .c{color:#454239}
a.crow:hover .dot{border-color:var(--ink)}
.crow.pend{color:var(--dim)}
.crow.pend .n{color:var(--dim)}
.crow.pend .p{color:var(--dim);background:none}
.cta{display:inline-flex;align-items:center;gap:10px;background:var(--volt);color:var(--ink);border:3px solid var(--volt);padding:15px 26px;font-family:'Geist Mono VF',monospace;font-weight:800;font-size:12.5px;letter-spacing:.1em;text-transform:uppercase;margin-top:clamp(26px,4vw,38px)}
.cta:hover{background:#d9ff45;border-color:#d9ff45}
.cta.ghost{background:transparent;color:var(--bone);border-color:var(--bone);margin-left:12px}
.cta.ghost:hover{background:var(--bone);color:var(--ink)}
.crumbs{font-family:'Geist Mono VF',monospace;font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin-bottom:clamp(26px,4vw,40px);display:flex;gap:10px;flex-wrap:wrap}
.crumbs a{border-bottom:2px solid var(--volt)}
.crumbs b{color:var(--bone)}
.chead{display:flex;flex-wrap:wrap;gap:14px;align-items:baseline}
.chead .dot{width:16px;height:16px;border:3px solid var(--bone);flex:0 0 auto;align-self:center}
.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:2px;border:3px solid var(--bone);margin-top:clamp(22px,3.5vw,32px);background:var(--line)}
.meta .cell{background:var(--noir);padding:12px 14px;font-family:'Geist Mono VF',monospace;text-transform:uppercase}
.meta .cell span{display:block;font-size:9px;font-weight:600;letter-spacing:.12em;color:var(--dim)}
.meta .cell b{font-size:12.5px;font-weight:800;letter-spacing:.03em}
.statcard{border:3px solid var(--volt);box-shadow:8px 8px 0 rgba(198,245,43,.25);margin-top:clamp(26px,4vw,40px);padding:0}
.statcard .top{display:flex;flex-wrap:wrap;align-items:stretch;border-bottom:2px solid var(--line)}
.statcard .big{flex:1 1 160px;padding:18px 20px;border-right:2px solid var(--line)}
.statcard .big:last-child{border-right:0}
.statcard .big b{display:block;font-family:'Archivo VF',sans-serif;font-stretch:125%;font-variation-settings:'wdth' 125,'wght' 900;font-weight:900;font-size:clamp(22px,3.6vw,34px);color:var(--volt)}
.statcard .big span{font-family:'Geist Mono VF',monospace;font-size:9px;font-weight:600;letter-spacing:.12em;color:var(--dim);text-transform:uppercase}
.statcard .acts{display:flex;flex-wrap:wrap;gap:0}
.statcard .acts a{flex:1 1 200px;text-align:center;padding:15px 16px;font-family:'Geist Mono VF',monospace;font-weight:800;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase}
.statcard .acts a.pdf{background:var(--volt);color:var(--ink)}
.statcard .acts a.pdf:hover{background:#d9ff45}
.statcard .acts a.reg{border-left:2px solid var(--line);color:var(--bone)}
.statcard .acts a.reg:hover{background:var(--bone);color:var(--ink)}
h2.sec{font-family:'Geist Mono VF',monospace;font-weight:800;font-size:12px;letter-spacing:.16em;text-transform:uppercase;background:var(--volt);color:var(--ink);display:inline-block;padding:5px 11px;margin-top:clamp(36px,6vw,56px)}
.labpanel{border:2px solid var(--line);margin-top:16px}
.labpanel .lhead{display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:space-between;align-items:baseline;background:var(--panel);border-bottom:2px solid var(--line);padding:13px 16px}
.labpanel .lhead b{font-family:'Geist Mono VF',monospace;font-weight:800;font-size:12px;letter-spacing:.08em;text-transform:uppercase}
.labpanel .lhead span{font-family:'Geist Mono VF',monospace;font-size:9.5px;font-weight:600;letter-spacing:.08em;color:var(--dim);text-transform:uppercase}
table.res{width:100%;border-collapse:collapse}
table.res td{padding:11px 16px;border-bottom:1px solid var(--line);font-size:13px;vertical-align:top}
table.res tr:last-child td{border-bottom:0}
table.res td.k{font-family:'Geist Mono VF',monospace;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);width:34%}
table.res td.s{color:var(--dim2);width:36%}
table.res td.r{font-family:'Geist Mono VF',monospace;font-weight:800;font-size:12px;text-align:right}
table.res td.r.ok{color:var(--volt)}
.note{margin-top:14px;color:var(--dim2);font-size:13.5px;line-height:1.7;max-width:640px}
.note b{color:var(--bone)}
.explain{border:2px solid var(--line);margin-top:16px}
.explain details{border-bottom:1px solid var(--line)}
.explain details:last-child{border-bottom:0}
.explain summary{list-style:none;cursor:pointer;padding:13px 16px;font-family:'Geist Mono VF',monospace;font-weight:700;font-size:11px;letter-spacing:.08em;text-transform:uppercase;display:flex;justify-content:space-between}
.explain summary::-webkit-details-marker{display:none}
.explain summary::after{content:'+';font-weight:800}
.explain details[open] summary::after{content:'–'}
.explain p{padding:0 16px 15px;color:var(--dim2);font-size:13.5px;line-height:1.7}
.future{margin-top:clamp(30px,5vw,44px);border-top:2px solid var(--line);padding-top:18px;color:var(--dim);font-family:'Geist Mono VF',monospace;font-size:10.5px;letter-spacing:.06em;line-height:1.9;text-transform:uppercase}
.future code{color:var(--dim2);font-family:inherit}
.legal{margin-top:clamp(34px,5vw,48px);border-top:3px solid var(--volt);padding-top:16px;font-family:'Geist Mono VF',monospace;font-weight:800;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase}
.foot{margin-top:12px;color:var(--dim);font-family:'Geist Mono VF',monospace;font-size:10px;letter-spacing:.06em;line-height:1.9;text-transform:uppercase}
@media(max-width:560px){.statcard .acts a.reg{border-left:0;border-top:2px solid var(--line)}}
`;

const FAVICON = `<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23000'/%3E%3Crect x='4' y='4' width='24' height='24' fill='%23C6F52B'/%3E%3Cpath d='M9 8h5v6l5-6h6l-7 8 7 8h-6l-5-6v6H9z' fill='%23000'/%3E%3C/svg%3E">`;

function head(title) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0A0A0A">
<meta name="robots" content="noindex">
${FAVICON}
<title>${title}</title>
<style>${CSS}</style></head><body><div class="wrap">`;
}

function brandbar() {
  return `<div class="brandbar"><a href="/" aria-label="KRN COA index"><img src="/assets/krn-wordmark-bone.svg" alt="KRN"></a><span class="tag mono">CERTIFICATE ARCHIVE</span></div>`;
}

function legal(pathNote) {
  return `<div class="future">VERIFY THIS PAGE · you should be at <code>https://coa.krnpeptides.com${pathNote}</code> · every future production lot publishes its certificates here before a single unit ships.</div>
<div class="legal">FOR RESEARCH PURPOSES ONLY · NOT FOR HUMAN CONSUMPTION</div>
<div class="foot">KRN · <a href="${REGISTER_URL}" style="border-bottom:2px solid var(--volt)">krnpeptides.com</a> · pharmaceutical-grade research peptides · Made in Korea (<span class="kr">한국산</span>)</div>
</div></body></html>`;
}

/* ---------- index ---------- */
function buildIndex() {
  const rows = COMPOUNDS.map((x) => `<a class="crow" href="/${x.slug}/">
  <span class="dot" style="background:${x.c}"></span>
  <span class="n">KRN-${x.name}</span>
  <span class="c">${x.contents} · ${x.dose}</span>
  <span class="p">${x.us ? "HPLC-UV " + x.us.purity : "PURITY " + x.kr.purity.replace(" ", "")} · LOT 26078</span>
  <span class="go">VIEW →</span>
</a>`).join("\n");

  return head("KRN · Certificates of Analysis") + brandbar() + `
<h1 class="display">Don't trust.<br>Verify.</h1>
<p class="sub">The permanent certificate record for every KRN compound. Independent third-party analysis per lot, published in full — read the results on the page, then open the signed laboratory PDF.</p>
<div class="statbar">
  <div class="cell"><b>HPLC-UV + LC-MS</b><span>PURITY &amp; IDENTITY · EVERY LOT</span></div>
  <div class="cell"><b>USP &lt;85&gt; · LAL</b><span>ENDOTOXIN STANDARD</span></div>
  <div class="cell"><b>KOREA + USA</b><span>INDEPENDENT LABORATORIES</span></div>
  <div class="cell"><b>≥99%</b><span>PURITY · EVERY PUBLISHED LOT</span></div>
</div>
<div class="rows">
${rows}
<div class="crow pend">
  <span class="dot" style="background:#2323C8"></span>
  <span class="n">GLOWTOX</span>
  <span class="c">SNAP-8 / GHK-Cu · 30ML SERUM</span>
  <span class="p">RECORD PUBLISHES ON LOT RELEASE</span>
</div>
</div>
<a class="cta" href="${REGISTER_URL}">JOIN THE REGISTER · FIRST ALLOCATION →</a>
` + legal("");
}

/* ---------- compound pages ---------- */
const EXPLAIN = `
<h2 class="sec">WHAT THESE TESTS MEASURE</h2>
<div class="explain">
<details><summary>Purity · HPLC-UV</summary><p>High-performance liquid chromatography with UV detection separates the compound from related impurities and quantifies each fraction. The reported percentage is the share of the sample that is the stated compound.</p></details>
<details><summary>Identity · LC-MS</summary><p>Mass spectrometry coupled to liquid chromatography confirms molecular identity by measuring exact mass-to-charge ratios. It answers one question: is the molecule exactly what the label says.</p></details>
<details><summary>Endotoxin · LAL (USP &lt;85&gt;)</summary><p>The Limulus Amebocyte Lysate assay detects bacterial endotoxins against the USP &lt;85&gt; standard. Run in replicate with a stated assay sensitivity.</p></details>
<details><summary>Microbial testing</summary><p>Culture-based counts (total bacteria, mold and yeast) and PCR-based detection screen for microbial contamination. A pass means counts within specification and no detectable microbial DNA respectively.</p></details>
<details><summary>Preservative effectiveness · 30 days</summary><p>The sealed liquid format is challenged with five organisms (E. coli, P. aeruginosa, S. aureus, C. albicans, A. brasiliensis) and must suppress them to defined Log₁₀ reduction criteria across 30 days. This test exists because KRN ships reconstituted, pre-filled cartridges — powder suppliers do not run it.</p></details>
</div>`;

function krPanel(x) {
  const L = LABS[x.kr.lab];
  return `<div class="labpanel">
<div class="lhead"><b>CERTIFICATE 01 · ${L.name} · ${L.country}</b><span>${L.full} · prepared ${x.kr.prepared} · approved ${x.kr.approved}</span></div>
<table class="res">
<tr><td class="k">APPEARANCE</td><td class="s">${x.kr.appearance}</td><td class="r ok">COMPLIES</td></tr>
<tr><td class="k">pH</td><td class="s">Spec ${x.kr.phSpec}</td><td class="r ok">${x.kr.ph}</td></tr>
<tr><td class="k">PURITY</td><td class="s">Spec ${x.kr.puritySpec}</td><td class="r ok">${x.kr.purity}</td></tr>
<tr><td class="k">ENDOTOXIN</td><td class="s">${x.kr.endotoxin[1]}</td><td class="r ok">${x.kr.endotoxin[2].toUpperCase()}</td></tr>
${x.kr.microbial.map((m) => `<tr><td class="k">MICROBIAL · ${m[0].toUpperCase()}</td><td class="s">${m[1]}</td><td class="r ok">${m[2].toUpperCase()}</td></tr>`).join("")}
<tr><td class="k">PRESERVATIVE EFFECTIVENESS</td><td class="s">${x.kr.preservative}</td><td class="r ok">COMPLIES</td></tr>
</table></div>`;
}

function usPanel(x) {
  const L = LABS[x.us.lab];
  return `<div class="labpanel">
<div class="lhead"><b>CERTIFICATE 02 · ${L.name} · ${L.country}</b><span>Accession ${x.us.accession} · received ${x.us.received} · reported ${x.us.reported}</span></div>
<table class="res">
<tr><td class="k">PURITY · HPLC-UV</td><td class="s">HPLC with UV detection coupled with mass spectrometry</td><td class="r ok">${x.us.purity}</td></tr>
<tr><td class="k">IDENTITY · LC-MS</td><td class="s">Molecular identity by mass-to-charge confirmation</td><td class="r ok">CONFIRMED</td></tr>
<tr><td class="k">ENDOTOXIN · USP &lt;85&gt;</td><td class="s">${x.us.endotoxin}</td><td class="r ok">PASS</td></tr>
<tr><td class="k">MICROBIAL · PCR</td><td class="s">${x.us.microbial}</td><td class="r ok">PASS</td></tr>
<tr><td class="k">APPEARANCE</td><td class="s">Visual inspection</td><td class="r ok">${x.us.appearance.toUpperCase()}</td></tr>
</table></div>
<p class="note">Chromatogram and mass-confirmation plots for this analysis are in the signed PDF. Search code <b>${x.us.search}</b> at FreedomDiagnosticsTesting.com.</p>`;
}

function buildCompound(x) {
  const usStat = x.us
    ? `<div class="big"><b>${x.us.purity}</b><span>PURITY · HPLC-UV · USA</span></div>`
    : `<div class="big"><b>${x.kr.purity.replace(" ", "")}</b><span>PURITY · ORIGIN LAB · KOREA</span></div>`;

  return head(`KRN-${x.name} · Certificate of Analysis · Lot 26078`) + brandbar() + `
<div class="crumbs"><a href="/">CERTIFICATE ARCHIVE</a><span>/</span><b>KRN-${x.name} · LOT 26078</b></div>
<div class="chead"><span class="dot" style="background:${x.c}"></span><h1 class="display">KRN-${x.name}</h1></div>
<div class="meta">
<div class="cell"><span>COMPOUND</span><b>${x.contents}</b></div>
<div class="cell"><span>DOSE</span><b>${x.dose}</b></div>
<div class="cell"><span>FORMAT</span><b>3ML PRE-FILLED CARTRIDGE</b></div>
<div class="cell"><span>ORIGIN</span><b><span class="kr">한국산</span> · MADE IN KOREA</b></div>
</div>

<h2 class="sec">LOT 26078 · CURRENT RECORD</h2>
<div class="statcard">
<div class="top">
${usStat}
<div class="big"><b>26078</b><span>LOT · MFG 2026-03-18 · EXP 2027-03-17</span></div>
<div class="big"><b>${x.us ? "2 LABS" : "1 LAB"}</b><span>${x.us ? "KOREA + USA · INDEPENDENT" : "ORIGIN CERTIFICATE · KOREA"}</span></div>
</div>
<div class="acts">
<a class="pdf" href="coa-lot-26078.pdf" target="_blank" rel="noopener">VIEW SIGNED CERTIFICATE · PDF ↗</a>
<a class="reg" href="${REGISTER_URL}">JOIN THE REGISTER →</a>
</div>
</div>
<p class="note">Match the <b>LOT number printed on your packaging</b> to the record on this page. This is the permanent certificate record for KRN-${x.name}; each production lot's certificates are added here as the lot is released.</p>

<h2 class="sec">RESULTS · ON THE PAGE, IN FULL</h2>
${krPanel(x)}
${x.us ? usPanel(x) : ""}
${x.ref ? `<div class="labpanel">
<div class="lhead"><b>REFERENCE · FREEDOM DIAGNOSTICS · USA</b><span>Supply-chain reference · LOT ${x.ref.lot} · reported ${x.ref.reported}</span></div>
<table class="res">
<tr><td class="k">PURITY · HPLC-UV</td><td class="s">Independent US analysis of the same ${x.name} formulation from the same production line</td><td class="r ok">${x.ref.purity}</td></tr>
<tr><td class="k">IDENTITY</td><td class="s">LC-MS</td><td class="r ok">CONFIRMED</td></tr>
</table></div>
<p class="note"><b>Note:</b> lot ${x.ref.lot} is a separate reference lot, not the inventory lot above. <a href="${x.ref.pdf}" target="_blank" rel="noopener" style="border-bottom:2px solid var(--volt)">VIEW REFERENCE ANALYSIS · PDF ↗</a></p>` : ""}

${EXPLAIN}

<h2 class="sec">STORAGE &amp; HANDLING</h2>
<p class="note">Refrigerate 2–8 °C. Protect from light. Sealed at origin; supplied strictly for laboratory research use.</p>
` + legal(`/${x.slug}/`);
}

/* ---------- write ---------- */
fs.writeFileSync("index.html", buildIndex());
for (const x of COMPOUNDS) fs.writeFileSync(`${x.slug}/index.html`, buildCompound(x));
console.log("built: index + " + COMPOUNDS.map((c) => c.slug).join(", "));
