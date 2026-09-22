# Northern lights

A single-page night sky over the Tana valley: aurora, a lemon-slice moon, and a mountain range — and the lemon-slice moon is a button. Press it and the land and the lights drop away, the page climbs into the stars, and a row of cabinets lights up. The way back down is the button at the bottom of the arcade (or the lemon again), and it's a slower ride.

## The arcade

Games live in `public/games/<id>/` as plain static folders (each with its own `index.html`) and are listed in `src/games.js`. To add one:

1. Drop the game's folder into `public/games/<id>/`.
2. Add an entry to `src/games.js` — id, title, tag, blurb, two accent colours, controls. Set `url` instead if the game is hosted somewhere else.
3. Commit. The Pages workflow builds and ships it.

Games open inside the site in a full-screen player (Escape or the `◂ Arcade` button brings you back), and every cabinet has an "open in a tab" link. `#arcade` in the URL lands straight in the stars; `#play=<id>` opens a game directly.

Current cabinets: **Voidmaw** — an arcade shooter (source: [DefNotALemon/voidmaw](https://github.com/DefNotALemon/voidmaw)).

Repo: [github.com/DefNotALemon/playlay](https://github.com/DefNotALemon/playlay)

## Local

```bash
npm install
npm run dev
```

## GitHub Pages

Settings → Pages → Source: GitHub Actions.

[https://defnotalemon.github.io/playlay/](https://defnotalemon.github.io/playlay/)
