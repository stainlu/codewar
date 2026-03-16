
<p align="center">
  <a href="https://codewar.dev/?users=stainlu,torvalds,mitchellh,bcherny&range=3m">
    <img src="https://codewar.dev/api/svg?users=stainlu,torvalds,mitchellh,bcherny&range=3m&v=3" alt="Code War Demo" />
  </a>
</p>

<h1 align="center">Code War</h1>

<p align="center">
  find out who actually codes and who just talks about it.<br>
  one line of markdown. zero auth. pure ego damage.
</p>

<p align="center">
  <a href="https://codewar.dev">
    <img src="https://img.shields.io/badge/website-codewar.dev-blue" alt="Website" />
  </a>
  <a href="https://github.com/stainlu/codewar/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/stainlu/codewar" alt="License" />
  </a>
  <a href="https://github.com/stainlu/codewar/stargazers">
    <img src="https://img.shields.io/github/stars/stainlu/codewar" alt="Stars" />
  </a>
</p>

---

## Flex on your friends in 10 seconds

Add this to your [GitHub Profile README](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme):

```markdown
[![Code War](https://codewar.dev/api/svg?users=YOUR_USERNAME,torvalds,mitchellh&range=3m)](https://codewar.dev/?users=YOUR_USERNAME,torvalds,mitchellh&range=3m)
```

Replace `YOUR_USERNAME` with yours. Prepare for emotional damage.

Or use [codewar.dev](https://codewar.dev) to configure your chart visually and copy the embed code.

---

## Options

| Parameter | Description | Values |
|-----------|-------------|--------|
| `users` | GitHub usernames to compare (comma-separated, max 5) | `torvalds,mitchellh` |
| `range` | Time range | `1m`, `3m`, `1y`, `all` |

### Examples

**3-month comparison (default):**
```
https://codewar.dev/api/svg?users=torvalds,mitchellh&range=3m
```

**Full history (for those who want the full ego trip):**
```
https://codewar.dev/api/svg?users=torvalds,mitchellh&range=all
```

---

## Features

- **Google Trends but for developer ego** — smooth lines comparing daily contributions
- **GitHub avatars** — circular avatars with colored borders, aligned to line endpoints
- **Hand-drawn aesthetic** — we embedded a 60KB font just for vibes (Virgil from Excalidraw)
- **Dark mode** — auto-adapts via `prefers-color-scheme`
- **Zero auth** — we don't want your data, just your contributions
- **Fast** — unless you're comparing with torvalds, then go make coffee
- **Satisfying line-drawing animation** — honestly the real reason people use this

---

## Pair it with these for maximum GitHub clout

- [github-readme-stats](https://github.com/anuraghazra/github-readme-stats) — GitHub stats cards
- [github-readme-streak-stats](https://github.com/DenverCoder1/github-readme-streak-stats) — Contribution streak stats
- [github-profile-trophy](https://github.com/ryo-ma/github-profile-trophy) — Trophy display

---

## How It Works

```
Your README                  codewar.dev                GitHub API
     │                            │                          │
     │  <img src="codewar.dev/    │                          │
     │   api/svg?users=...">      │                          │
     │ ──────────────────────────>│                          │
     │                            │  GraphQL: contributions  │
     │                            │ ────────────────────────>│
     │                            │                          │
     │                            │  <── daily counts + avatar│
     │                            │                          │
     │    <── SVG chart            │                          │
     │        (cached 24h)        │                          │
```

- **Data**: GitHub GraphQL API (`contributionsCollection`)
- **Rendering**: Server-side SVG with embedded Virgil font
- **Hosting**: Cloudflare Workers (edge-deployed globally)
- **Caching**: Cloudflare KV (contribution data 24h, rendered SVGs 24h)

---

## Self-Hosting

1. Clone the repo
2. `npm install`
3. Create a [GitHub Personal Access Token](https://github.com/settings/tokens) (no scopes needed)
4. `cp .dev.vars.example .dev.vars` and add your token
5. `npx wrangler dev` for local development
6. `npx wrangler deploy` to deploy to Cloudflare Workers

---

## Contributing

PRs welcome. Issues also welcome. Memes in issues especially welcome.

---

## License

[MIT](LICENSE) — do whatever you want with it.

built by [@stainlu](https://github.com/stainlu) who was mass-comparing developers at 3am and thought "this should be a product"

star-history.com showed us repo stars. we said "ok but who actually writes the code?"
