# camille.sh

The one-page home of camille.sh, a one-person studio that ships Mac and iPhone apps and, when the mood strikes, web things too. The name is a shell script. The logo is a churning field of dither cells with a cursor blinking at the end, waiting for input, which is roughly the state of the studio at any given moment.

## Run it

```sh
hugo server        # http://localhost:1313, rebuilds on save
hugo --minify      # writes the site to public/
```

That's it. Hugo minifies the CSS and bundles the JS on its own (esbuild lives inside it), so there is no `npm install`, no lockfile, and nothing to forget to update.

## What lives where

| path | what it is |
|---|---|
| `content/_index.md` | the words: about, freelance |
| `hugo.toml` | the facts: owner, email, KvK, VAT, GitHub, and the project list |
| `layouts/home.html` | the page |
| `layouts/baseof.html` | the document around it |
| `assets/css/site.css` | the stylesheet, one theme, one ochre |
| `assets/js/dither.js` | the wordmark: Bayer 8×8 over domain-warped noise, drawn through a text mask in WebGL, one texel per cell |
| `assets/js/site.js` | wires the wordmark to the hero, makes the weather thicken under the pointer, and reads the colours from the stylesheet |
| `static/fonts/` | Martian Mono and Hanken Grotesk, self-hosted, so no visitor ever phones Google |

## Deploying

The site lives at `/www/camille.sh` on the server as a checkout of this repo, next to its siblings, and Caddy serves `public/` from there.

```sh
ssh www@camille.sh
cd camille.sh && ./deploy.sh --pull
```

`deploy.sh` points at `deploy/freebsd/deploy.sh`: pull, build into `build/`, swap it in as `public/` in one move, then tell IndexNow which pages changed (`-n` skips that). `deploy/alpine/deploy.sh` is the same script for a Linux box.

## Adding a project

Append a `[[params.projects]]` block in `hugo.toml`: `name`, `url`, `platform`, an optional `tagline`, and a `summary`. Set `censored = 11` instead of a name and the row comes out redacted, black bars and all, for the project that isn't public yet. The number is the width of the bar in characters. The summary can carry bars of its own as `<span class="censor" style="--w:9ch"></span>`.

## The yellow

It is `--geel` in `assets/css/site.css` and nowhere else. The wordmark reads it at load. Yellow on white can't carry text, so it only ever fills: the cursor, the chips behind `#`, the highlighter under links, and the dense core of the `.sh`.
