// Where the money and the downloads live. Change a handle here and every
// button on the site follows (nav, ground-page panel, arcade strip, footer).
//
//   kofi — tip jar. Ko-fi pays out to PayPal or Stripe, which pays out to your card/bank.
//   itch — your itch.io creator page. Give a cabinet an `itch:` url in games.js
//          and it grows an "itch.io ↗" link too.

export const links = {
  kofi: "https://ko-fi.com/defnotalemon",
  itch: "https://defnotalemon.itch.io",
};

for (const el of document.querySelectorAll("[data-link]")) {
  const url = links[el.dataset.link];
  if (url) el.href = url;
}
