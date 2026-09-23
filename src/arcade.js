// The white button, the lift-off, and the cabinet row.
// aurora.js reads `lift.p` (0 = on the ground, 1 = up in the stars) every frame
// and moves the landscape accordingly; everything DOM-side lives here.

import { games, gameUrl } from "./games.js";
import { reduced } from "./skykit.js";

export const lift = { target: 0, p: 0, vel: 0 };

const DUR_UP = 2.6; // seconds, ground → stars
const DUR_DOWN = 4.6; // the way back is a long, slow settle
const dur = (up) => (up ? DUR_UP : DUR_DOWN);
const body = document.body;
const coin = document.querySelector("#coin");
const coinLabel = document.querySelector("#coinLabel");
const arcade = document.querySelector("#arcade");
const grid = document.querySelector("#cabinets");
const player = document.querySelector("#player");
const frame = document.querySelector("#playerFrame");
const playerTitle = document.querySelector("#playerTitle");
const playerOpen = document.querySelector("#playerOpen");

/* ---------- audio: a thunk and a whoosh, nothing more ---------- */
let AC = null;
function ac() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      /* no audio, no problem */
    }
  }
  if (AC && AC.state === "suspended") AC.resume();
  return AC;
}
function thunk() {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(140, a.currentTime);
  o.frequency.exponentialRampToValueAtTime(50, a.currentTime + 0.12);
  g.gain.setValueAtTime(0.25, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.14);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + 0.15);
}
function whoosh(up) {
  const a = ac();
  if (!a) return;
  const D = dur(up);
  const n = (a.sampleRate * D) | 0;
  const buf = a.createBuffer(1, n, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const env = Math.sin((i / n) * Math.PI);
    d[i] = (Math.random() * 2 - 1) * env * env;
  }
  const s = a.createBufferSource();
  s.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 0.9;
  f.frequency.setValueAtTime(up ? 180 : 1400, a.currentTime);
  f.frequency.exponentialRampToValueAtTime(up ? 1400 : 180, a.currentTime + D);
  const g = a.createGain();
  g.gain.value = 0.12;
  s.connect(f).connect(g).connect(a.destination);
  s.start();
}

/* ---------- state ---------- */
let liftTimer = 0;
export function setSpace(on, { animate = true } = {}) {
  lift.target = on ? 1 : 0;
  clearTimeout(liftTimer);
  if (animate && !reduced()) {
    body.classList.add("lifting");
    liftTimer = setTimeout(() => body.classList.remove("lifting"), (dur(on) + 0.5) * 1000);
  }
  if (!animate || reduced()) {
    lift.p = lift.target;
    body.classList.add("no-anim");
    requestAnimationFrame(() => requestAnimationFrame(() => body.classList.remove("no-anim")));
  }
  body.classList.toggle("space", on);
  if (!animate || reduced()) void body.offsetWidth; // flush styles while transitions are off, so a reload in the arcade never animates in
  coin.setAttribute("aria-pressed", on ? "true" : "false");
  coinLabel.textContent = on ? "Kjøllefjord" : "arcade";
  if (on) window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
  const hash = on ? "#arcade" : "";
  if (location.hash !== hash) history.replaceState(null, "", location.pathname + location.search + hash);
}

// Called by aurora.js each frame with the elapsed seconds.
export function stepLift(dt) {
  const before = lift.p;
  const rate = dt / dur(lift.target > lift.p);
  if (lift.p < lift.target) lift.p = Math.min(lift.target, lift.p + rate);
  else if (lift.p > lift.target) lift.p = Math.max(lift.target, lift.p - rate);
  lift.vel = (lift.p - before) / Math.max(dt, 1e-4);
}

/* ---------- the button ---------- */
function press(on) {
  thunk();
  if (!reduced()) whoosh(on);
  coin.classList.add("down");
  setTimeout(() => coin.classList.remove("down"), 140);
  setSpace(on);
}
coin.addEventListener("click", () => press(!body.classList.contains("space")));
document.querySelector("#ground").addEventListener("click", () => press(false));

/* ---------- cabinets ---------- */
function cabinet(g) {
  const el = document.createElement("article");
  el.className = "cab";
  el.style.setProperty("--a", g.accent[0]);
  el.style.setProperty("--b", g.accent[1]);
  el.innerHTML = `
    <div class="marquee"><span>${g.title}</span></div>
    <div class="cab-body">
      <small>${g.tag}</small>
      <p>${g.blurb}</p>
    </div>
    <div class="cab-foot">
      <span class="ctl">${g.controls || ""}</span>
      <button type="button" class="coinslot" data-id="${g.id}">Insert coin <b>▸</b></button>
    </div>`;
  el.querySelector(".coinslot").addEventListener("click", () => play(g));
  return el;
}

function renderCabinets() {
  grid.innerHTML = "";
  for (const g of games) grid.appendChild(cabinet(g));
  const ghost = document.createElement("article");
  ghost.className = "cab ghost";
  ghost.innerHTML = `<div class="marquee"><span>Next cabinet</span></div><div class="cab-body"><p>An empty bay. Drop a folder into <code>public/games/</code>, add one entry to <code>src/games.js</code>, and it lights up here.</p></div>`;
  grid.appendChild(ghost);
}

/* ---------- the player ---------- */
let current = null;
function play(g) {
  current = g;
  const url = gameUrl(g);
  playerTitle.textContent = g.title;
  playerOpen.href = url;
  frame.src = url;
  player.hidden = false;
  body.classList.add("playing");
  frame.addEventListener("load", () => frame.contentWindow?.focus(), { once: true });
  history.replaceState(null, "", location.pathname + location.search + "#play=" + g.id);
}
function stop() {
  frame.src = "about:blank";
  player.hidden = true;
  body.classList.remove("playing");
  current = null;
  history.replaceState(null, "", location.pathname + location.search + "#arcade");
  coin.focus();
}
document.querySelector("#playerExit").addEventListener("click", stop);
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && current) stop();
});

/* ---------- boot ---------- */
renderCabinets();
const m = location.hash.match(/^#(arcade|play=([\w-]+))$/);
if (m) {
  setSpace(true, { animate: false });
  if (m[2]) {
    const g = games.find((x) => x.id === m[2]);
    if (g) play(g);
  }
}
