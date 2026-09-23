// The lemon is the moon, so it wears tonight's real phase.
// Elongation of the moon from the sun (low-precision Meeus terms, good to ~1°)
// drives a shadow over the lemon, the "moon" stat, and the browser-tab icon.

const rad = Math.PI / 180;
const wrap = (x) => ((x % 360) + 360) % 360;

export function moonPhase(date = new Date()) {
  const d = date.getTime() / 86400000 + 2440587.5 - 2451545; // days since J2000
  const g = 357.528 + 0.9856003 * d;
  const sun = 280.46 + 0.9856474 * d + 1.915 * Math.sin(g * rad) + 0.02 * Math.sin(2 * g * rad);
  const Mp = 134.963 + 13.064993 * d;
  const D = 297.85 + 12.190749 * d;
  const F = 93.272 + 13.22935 * d;
  const moon =
    218.316 + 13.176396 * d +
    6.289 * Math.sin(Mp * rad) - 1.274 * Math.sin((Mp - 2 * D) * rad) + 0.658 * Math.sin(2 * D * rad) +
    0.214 * Math.sin(2 * Mp * rad) - 0.186 * Math.sin(g * rad) - 0.114 * Math.sin(2 * F * rad);
  const e = wrap(moon - sun); // 0 new · 90 first quarter · 180 full · 270 last quarter
  return { age: e / 360, lit: (1 - Math.cos(e * rad)) / 2, waxing: e < 180, name: phaseName(e) };
}

function phaseName(e) {
  if (e < 6 || e > 354) return "new";
  if (Math.abs(e - 90) < 6) return "first quarter";
  if (Math.abs(e - 180) < 6) return "full";
  if (Math.abs(e - 270) < 6) return "last quarter";
  const side = e < 180 ? "waxing" : "waning";
  return `${side} ${e < 90 || e > 270 ? "crescent" : "gibbous"}`;
}

// Dark part of a disc radius r at (cx, cy). Waxing: lit from the right (northern sky).
function shadowPath({ age, waxing }, cx = 50, cy = 50, r = 48.5) {
  const k = Math.cos(age * 2 * Math.PI); // 1 new → 0 quarter → −1 full
  const rx = Math.max(Math.abs(k) * r, 0.01);
  const top = `${cx} ${cy - r}`, bot = `${cx} ${cy + r}`;
  // waxing: dark limb on the left, terminator bulges right while a crescent, left once gibbous
  const p = `M${top} A${r} ${r} 0 0 0 ${bot} A${rx} ${r} 0 0 ${k > 0 ? 0 : 1} ${top}Z`;
  return waxing ? { d: p, t: "" } : { d: p, t: `translate(${2 * cx} 0) scale(-1 1)` };
}

const NS = "http://www.w3.org/2000/svg";
const svg = document.querySelector("#coin svg");
let shade, iconLink;

function paint() {
  const ph = moonPhase();
  const { d, t } = shadowPath(ph);

  if (svg && !shade) {
    const defs = svg.querySelector("defs");
    defs.insertAdjacentHTML(
      "beforeend",
      `<filter id="terminator" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter>
       <clipPath id="disc"><circle cx="50" cy="50" r="48"/></clipPath>`
    );
    const g = document.createElementNS(NS, "g");
    g.setAttribute("clip-path", "url(#disc)");
    shade = document.createElementNS(NS, "path");
    shade.setAttribute("fill", "rgba(4,7,18,.86)"); // the night side, with a whisper of earthshine
    shade.setAttribute("filter", "url(#terminator)");
    g.append(shade);
    svg.append(g);
  }
  if (shade) {
    shade.setAttribute("d", d);
    t ? shade.setAttribute("transform", t) : shade.removeAttribute("transform");
  }

  const pct = Math.round(ph.lit * 100);
  const stat = document.querySelector("#moonStat");
  if (stat) stat.textContent = `lemon, ${ph.name}`;
  if (stat) stat.title = `${pct}% lit`;
  document.querySelector("#coin")?.setAttribute("aria-label", `Arcade: lift off into the stars (moon: ${ph.name}, ${pct}% lit)`);

  setIcon();
}

// Tab icon = the lemon as it looks right now. PNG for every browser, SVG first so it shows instantly.
function setIcon() {
  if (!svg) return;
  const copy = svg.cloneNode(true);
  copy.setAttribute("xmlns", NS);
  copy.setAttribute("width", "64");
  copy.setAttribute("height", "64");
  copy.querySelector("path[filter]")?.setAttribute("fill", "rgba(4,7,18,.9)");
  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(copy));

  iconLink ||= document.querySelector("link[rel~='icon']") || document.head.appendChild(Object.assign(document.createElement("link"), { rel: "icon" }));
  iconLink.type = "image/svg+xml";
  iconLink.href = src;

  const img = new Image();
  img.onload = () => {
    try {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      c.getContext("2d").drawImage(img, 0, 0, 64, 64);
      iconLink.type = "image/png";
      iconLink.href = c.toDataURL("image/png");
    } catch {}
  };
  img.src = src;
}

paint();
setInterval(paint, 10 * 60 * 1000); // the moon moves; keep up with it on long visits
