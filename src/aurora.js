import { resizeCanvas, fbm, noise, makeStars, drawStars, reduced } from "./skykit.js";

const canvas = document.querySelector("#sky");
const mouse = { x: innerWidth / 2, y: innerHeight * 0.3 };
addEventListener(
  "pointermove",
  (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  },
  { passive: true }
);

let w = innerWidth;
let h = innerHeight;
let ctx;
let stars = [];

const BW = 256;
const BH = 144;
const off = document.createElement("canvas");
off.width = BW;
off.height = BH;
const octx = off.getContext("2d", { willReadFrequently: true });
const pixels = octx.createImageData(BW, BH);

function n3(x, y) {
  return noise(x, y) * 0.5 + noise(x * 2.03, y * 2.03) * 0.32 + noise(x * 4.07, y * 4.07) * 0.18;
}

function setup() {
  ({ ctx, w, h } = resizeCanvas(canvas, 1.75));
  stars = makeStars(Math.floor((w * h) / 2800), w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}
setup();
addEventListener("resize", setup);

function paintAurora(t) {
  const d = pixels.data;
  d.fill(0);
  const pull = (mouse.x / w - 0.5) * 0.28;
  const time = reduced() ? 5.4 : t;

  for (let x = 0; x < BW; x++) {
    const u = x / BW + pull;
    const shape = n3(u * 2.2 + time * 0.045, time * 0.035);
    const fold = n3(u * 4.8 - time * 0.025, 9.1 + time * 0.02);
    const peak = 0.17 + shape * 0.16;
    const spread = 0.11 + fold * 0.09;
    const strength = 0.18 + shape * 0.22;
    const mag = Math.max(0, fold * 1.15 - 0.25);

    for (let y = 0; y < (BH * 0.7) | 0; y++) {
      const v = y / BH;
      const dy = (v - peak) / spread;
      let i = Math.exp(-dy * dy) * strength;
      if (i < 0.01) continue;
      const grain = 0.72 + 0.28 * noise(u * 9.5, v * 1.35 + time * 0.06);
      i *= grain;
      i *= Math.max(0, 1 - (v - 0.28) / 0.18);

      const r = 50 + mag * 130;
      const g = 155 + (1 - mag) * 35;
      const b = 100 + mag * 70;
      const idx = (y * BW + x) << 2;
      const glow = i * 2.05;
      d[idx] = Math.min(255, r * glow);
      d[idx + 1] = Math.min(255, g * glow);
      d[idx + 2] = Math.min(255, b * glow);
      d[idx + 3] = Math.min(165, i * 380);
    }
  }

  octx.putImageData(pixels, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.filter = "blur(18px)";
  ctx.globalAlpha = 0.65;
  ctx.drawImage(off, -w * 0.03, -h * 0.02, w * 1.06, h * 0.52);
  ctx.filter = "blur(6px)";
  ctx.globalAlpha = 0.4;
  ctx.drawImage(off, 0, 0, w, h * 0.48);
  ctx.filter = "none";
  ctx.restore();
}

function drawMoon() {
  const mx = w * 0.82;
  const my = h * 0.16;
  const rad = Math.min(w, h) * 0.055;
  const segs = 9;

  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(-0.18);

  const halo = ctx.createRadialGradient(0, 0, rad * 0.4, 0, 0, rad * 2.6);
  halo.addColorStop(0, "rgba(255, 220, 80, 0.22)");
  halo.addColorStop(0.45, "rgba(255, 196, 50, 0.08)");
  halo.addColorStop(1, "rgba(255, 190, 40, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, rad * 2.6, 0, Math.PI * 2);
  ctx.fill();

  // rind
  ctx.fillStyle = "#E8B423";
  ctx.beginPath();
  ctx.arc(0, 0, rad, 0, Math.PI * 2);
  ctx.fill();

  // pith
  ctx.fillStyle = "#F6EED8";
  ctx.beginPath();
  ctx.arc(0, 0, rad * 0.86, 0, Math.PI * 2);
  ctx.fill();

  // pulp
  const pulp = ctx.createRadialGradient(-rad * 0.2, -rad * 0.15, rad * 0.1, 0, 0, rad * 0.8);
  pulp.addColorStop(0, "#FFE56A");
  pulp.addColorStop(1, "#F0C43A");
  ctx.fillStyle = pulp;
  ctx.beginPath();
  ctx.arc(0, 0, rad * 0.78, 0, Math.PI * 2);
  ctx.fill();

  // vesicles — soft dots in each wedge
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, rad * 0.76, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "rgba(255, 248, 180, 0.35)";
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2;
    const a1 = ((i + 1) / segs) * Math.PI * 2;
    const mid = (a0 + a1) / 2;
    for (let k = 0; k < 7; k++) {
      const t = 0.22 + (k % 4) * 0.14;
      const jitter = ((k * 17 + i * 13) % 10) / 90;
      const rr = rad * (t + jitter);
      ctx.beginPath();
      ctx.arc(Math.cos(mid + jitter) * rr, Math.sin(mid - jitter * 0.6) * rr, rad * 0.045, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // membranes
  ctx.strokeStyle = "rgba(255, 248, 230, 0.72)";
  ctx.lineWidth = Math.max(1.2, rad * 0.035);
  ctx.lineCap = "round";
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * rad * 0.1, Math.sin(a) * rad * 0.1);
    ctx.lineTo(Math.cos(a) * rad * 0.78, Math.sin(a) * rad * 0.78);
    ctx.stroke();
  }

  // core
  ctx.fillStyle = "#F7F1DC";
  ctx.beginPath();
  ctx.arc(0, 0, rad * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // rind highlight
  ctx.strokeStyle = "rgba(255, 236, 140, 0.55)";
  ctx.lineWidth = Math.max(2, rad * 0.06);
  ctx.beginPath();
  ctx.arc(0, 0, rad * 0.93, -2.4, -0.9);
  ctx.stroke();

  ctx.restore();
}

function samplePeaks(peaks, t) {
  const x = Math.max(0, Math.min(1, t));
  for (let i = 0; i < peaks.length - 1; i++) {
    const a = peaks[i];
    const b = peaks[i + 1];
    if (x >= a[0] && x <= b[0]) {
      const u = (x - a[0]) / (b[0] - a[0] || 1);
      const s = u * u * (3 - 2 * u);
      return a[1] + (b[1] - a[1]) * s;
    }
  }
  return peaks[peaks.length - 1][1];
}

const FAR_PEAKS = [
  [0, 0.22], [0.07, 0.48], [0.14, 0.18], [0.2, 0.62], [0.26, 0.28],
  [0.34, 0.9], [0.4, 0.34], [0.48, 0.55], [0.56, 0.2], [0.64, 0.78],
  [0.72, 0.32], [0.8, 0.58], [0.88, 0.24], [0.95, 0.44], [1, 0.3],
];
const NEAR_PEAKS = [
  [0, 0.2], [0.1, 0.55], [0.18, 0.12], [0.28, 0.72], [0.36, 0.22],
  [0.46, 0.5], [0.55, 0.08], [0.66, 0.68], [0.74, 0.18], [0.84, 0.46],
  [0.92, 0.16], [1, 0.38],
];

function drawRange(peaks, base, scale, fill) {
  const step = 3;
  const ys = [];
  ctx.beginPath();
  ctx.moveTo(-2, h);
  for (let x = 0; x <= w + step; x += step) {
    const ht = samplePeaks(peaks, x / w);
    const jag = (noise(x * 0.035, 4.2) - 0.5) * scale * 0.05;
    const y = base - ht * scale + jag;
    ys.push(y);
    if (x === 0) ctx.lineTo(0, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineTo(w + 2, h);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  return { ys, step };
}

function drawMountains() {
  const far = drawRange(FAR_PEAKS, h * 0.72, h * 0.3, "#101820");
  const near = drawRange(NEAR_PEAKS, h * 0.82, h * 0.26, "#05080e");
  return { far, near };
}

function drawGround() {
  ctx.beginPath();
  ctx.moveTo(0, h);
  const base = h * 0.84;
  ctx.lineTo(0, base + 8);
  for (let x = 0; x <= w; x += 12) {
    ctx.lineTo(x, base + Math.sin(x * 0.01) * 6 + fbm(x * 0.008, 3) * 10);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = "#04060a";
  ctx.fill();
}

function hashTree(i) {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

function pine(x, ground, height) {
  ctx.beginPath();
  ctx.moveTo(x, ground - height);
  ctx.lineTo(x + height * 0.32, ground);
  ctx.lineTo(x - height * 0.32, ground);
  ctx.closePath();
  ctx.fill();
}

function forestOn(range, spacing, sizeMin, sizeMax, color) {
  ctx.fillStyle = color;
  let n = 0;
  for (let x = -6; x < w + 6; x += spacing) {
    const idx = Math.min(range.ys.length - 1, Math.max(0, Math.round(x / range.step)));
    const ridge = range.ys[idx];
    for (let y = ridge + 3; y < h * 0.91; y += spacing * 0.82) {
      const jx = x + (hashTree(n) - 0.5) * spacing * 0.9;
      const jy = y + (hashTree(n + 4) - 0.5) * spacing * 0.45;
      n += 1;
      if (jy < ridge + 2) continue;
      const t = (jy - ridge) / Math.max(30, h * 0.91 - ridge);
      const ht = sizeMin + t * (sizeMax - sizeMin) * (0.65 + hashTree(n + 11) * 0.7);
      pine(jx, jy, ht);
    }
  }
}

function drawCabin() {
  const x = w * 0.16;
  const y = h * 0.86;
  ctx.fillStyle = "#07090f";
  ctx.fillRect(x, y - 28, 54, 28);
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 28);
  ctx.lineTo(x + 27, y - 48);
  ctx.lineTo(x + 60, y - 28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255, 186, 92, 0.45)";
  ctx.fillRect(x + 12, y - 18, 8, 8);
  ctx.fillRect(x + 32, y - 18, 8, 8);
  ctx.shadowBlur = 8;
  ctx.shadowColor = "rgba(255,180,80,0.35)";
  ctx.fillRect(x + 12, y - 18, 8, 8);
  ctx.shadowBlur = 0;
}

function drawSky() {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#02040c");
  g.addColorStop(0.35, "#071428");
  g.addColorStop(0.7, "#0a1a22");
  g.addColorStop(1, "#02060b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function tick(now) {
  const t = now / 1000;
  drawSky();
  drawMoon();
  drawStars(ctx, stars, t, reduced() ? 0 : t * 2, 0, w, h);
  paintAurora(t);

  const ranges = drawMountains();
  forestOn(ranges.far, 9, 3.5, 8, "#0a1018");
  forestOn(ranges.near, 7, 5, 13, "#02040a");
  drawGround();
  forestOn(
    { ys: ranges.near.ys.map((y) => Math.max(y, h * 0.83)), step: ranges.near.step },
    8,
    6,
    12,
    "#010309"
  );
  drawCabin();

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

const kp = document.querySelector("#kp");
if (kp && !reduced()) {
  setInterval(() => {
    const v = (4.8 + Math.sin(Date.now() / 9000) * 0.7 + Math.random() * 0.15).toFixed(1);
    kp.textContent = v;
  }, 2200);
}
