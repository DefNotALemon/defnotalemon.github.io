// The arcade's cabinet list. Add a game by dropping its folder into
// public/games/<id>/ (with an index.html) and adding an entry here.
//
//   id       — folder name under public/games/, also used in the URL hash
//   title    — marquee text
//   tag      — one-line genre label
//   blurb    — two sentences, tops
//   accent   — marquee glow colours (two hex values)
//   controls — what the player needs to know before the coin drops
//   url      — override if the game lives somewhere else (another repo, another host)

export const games = [
  {
    id: "voidmaw",
    title: "Voidmaw",
    tag: "arcade shooter · 1982 rules",
    blurb:
      "Something is being assembled out in the dark. Mine crystals before the drones do, stack them as homing bombs, and be holding thirteen when the Maw wakes up.",
    accent: ["#ff3b5c", "#5ef2ff"],
    controls: "keyboard · touch",
  },
];

export const gameUrl = (g) => g.url || `./games/${g.id}/index.html`;
