
<p align="center">
  <a href="https://codewar.dev/?user=stainlu&targets=torvalds,mitchellh,bcherny&range=3m">
    <img src="https://codewar.dev/api/svg?users=stainlu,torvalds,mitchellh,bcherny&range=3m&self=stainlu&v=5" alt="CAN YOU BEAT @bcherny?" />
  </a>
</p>

<h1 align="center">CAN YOU BEAT @bcherny?</h1>

<p align="center">
  Compare your GitHub contributions against anyone.<br>
  Embed in your profile. Share on X. Zero auth.
</p>

<p align="center">
  <a href="https://codewar.dev"><strong>codewar.dev</strong></a>
</p>

<p align="center">
  <a href="https://codewar.dev">
    <img src="https://img.shields.io/badge/try_it-codewar.dev-blue" alt="Try it" />
  </a>
  <a href="https://github.com/stainlu/codewar/stargazers">
    <img src="https://img.shields.io/github/stars/stainlu/codewar" alt="Stars" />
  </a>
  <a href="https://github.com/stainlu/codewar/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/stainlu/codewar" alt="License" />
  </a>
</p>

---

## Embed in your GitHub profile

Add one line to your [profile README](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme):

```markdown
[![Code War](https://codewar.dev/api/svg?users=YOUR_USERNAME,torvalds,bcherny&range=3m&self=YOUR_USERNAME)](https://codewar.dev/?user=YOUR_USERNAME&targets=torvalds,bcherny&range=3m)
```

Replace `YOUR_USERNAME` with yours. Or use [codewar.dev](https://codewar.dev) to build your chart visually and copy the embed code.

---

## Share on X

Every chart generates a Twitter Card automatically. Click "Share on X" on the site, or post any codewar.dev link — the chart appears as the preview image.

---

## How it works

| Parameter | Description | Values |
|-----------|-------------|--------|
| `users` | GitHub usernames (comma-separated, max 5) | `torvalds,bcherny` |
| `range` | Time range | `1m`, `3m`, `1y`, `all` |
| `self` | Your username (excluded from title, thicker line) | `stainlu` |

The chart title dynamically shows **CAN YOU BEAT @{top performer}** — the user with the highest average contributions in the selected range (excluding yourself).

---

## Features

- **Google Trends for GitHub contributions** — smooth lines comparing daily commits
- **Dynamic title** — "CAN YOU BEAT @xxx" challenges you to outcode the best
- **Hand-drawn aesthetic** — Virgil font from Excalidraw, wobbly grid lines
- **GitHub avatars** — circular avatars with colored borders
- **Dark mode** — auto-adapts via `prefers-color-scheme`
- **Twitter Cards** — share any link, chart appears as preview image
- **Zero auth** — no tokens, no login, just usernames

---

## Tech

```
Your README / X post          codewar.dev               GitHub API
        │                          │                         │
        │  img src / og:image      │                         │
        │ ────────────────────────>│                         │
        │                          │  GraphQL: contributions │
        │                          │ ───────────────────────>│
        │                          │                         │
        │                          │  <── daily counts       │
        │                          │                         │
        │    <── SVG (cached 24h)  │                         │
```

- **Rendering**: Server-side SVG with embedded Virgil font (WOFF2)
- **Hosting**: Cloudflare Workers (edge-deployed globally)
- **OG Images**: Cloudflare Browser Rendering (Puppeteer screenshots SVG → PNG)
- **Caching**: Cloudflare KV (24h for data + rendered images)

---

## Self-hosting

```bash
git clone https://github.com/stainlu/codewar.git
cd codewar && npm install
# Create a GitHub token (no scopes needed): https://github.com/settings/tokens
cp .dev.vars.example .dev.vars  # add your token
npx wrangler dev                # local dev
npx wrangler deploy             # deploy to Cloudflare Workers
```

---

## License

[MIT](LICENSE)

Built by [@stainlu](https://github.com/stainlu). Inspired by [star-history.com](https://star-history.com).
