# Code War — Complete Launch & Promotion Plan

## The Flywheel

```
Seed 100 stars (personal network)
    → Twitter amplifiers (@GithubProjects, @StarHistoryHQ)
        → Star velocity spike
            → GitHub Trending
                → 1000+ stars compound growth
                    → "Awesome" list acceptance
                        → Blog posts citing it
                            → Self-sustaining viral loop
```

---

## Phase 0: Pre-Launch Prep (Do Before Any Public Promotion)

### 1. Repo README rewrite

Structure (proven pattern from github-readme-stats):
```
1. Hero demo chart (live SVG from codewar.dev — clickable)
2. One-liner: "Compare GitHub contributions like Google Trends"
3. Badges: website, license, stars
4. Quick Start — 2-line code block (THE most important section)
5. Demo screenshot on a real GitHub profile
6. Customization table (users, range params)
7. "Works Great Alongside" — cross-links to github-readme-stats, streak-stats, profile-trophy
8. How It Works — architecture diagram
9. Self-hosting instructions
10. Contributing / License
```

**Critical**: Embed code BEFORE technical details. Copy → paste → done in 10 seconds.

### 2. Repo metadata

- **Description**: `Compare GitHub contributions like Google Trends. Embeddable SVG chart for your profile README. Zero auth, one line of markdown.`
- **Topics** (20): `github-profile-readme`, `github-readme`, `github-stats`, `github-contributions`, `github-profile`, `contribution-graph`, `github-api`, `data-visualization`, `svg`, `chart`, `google-trends`, `github-compare`, `developer-tools`, `open-source`, `typescript`, `cloudflare-workers`, `serverless`, `embed`, `hand-drawn`, `contribution-comparison`
- **Social preview image**: 1280x640px screenshot of chart on a GitHub profile
- **Website URL**: `https://codewar.dev`

### 3. Dogfood

Re-add Code War chart to `stainlu/stainlu` profile README.

### 4. Seed initial stars

DM 10-20 developer friends → star + add to their profiles. **Target: 50-100 stars before any public post.**

---

## Phase 1: Launch Day (Day 1)

### Platform 1: Dev.to (Morning)

**Title**: `I built a tool that compares GitHub contributions like Google Trends — embed it on your profile in 60 seconds`

**Tags**: `#showdev`, `#opensource`, `#github`, `#webdev`

**Structure**:
1. Hook: screenshot of chart on your GitHub profile
2. "Here's how I compare to Linus Torvalds" (attention-grab)
3. How to add it (one line of markdown, 60 seconds)
4. Brief tech overview (Cloudflare Workers, GitHub GraphQL)
5. Links to repo + website

### Platform 2: Hashnode (Morning)

Cross-post Dev.to article. Set canonical URL to Dev.to. Tags: `GitHub`, `Open Source`, `Developer Tools`.

### Platform 3: Medium (Morning)

Cross-post to Medium. Publications to submit to: "Better Programming", "JavaScript in Plain English", "Towards Dev". Set canonical URL.

### Platform 4: Twitter/X (Afternoon)

**Thread format** (4 tweets):

Tweet 1 (hook):
> I built a tool that compares GitHub contributions like Google Trends
>
> Here's how I stack up against Linus Torvalds
>
> [screenshot]
>
> Add it to your GitHub profile in 60 seconds. Zero auth.
> codewar.dev

Tweet 2: How it looks on a real profile (screenshot)
Tweet 3: The one-line markdown + "that's it, you're done"
Tweet 4: "Open source, MIT licensed" + repo link

**Tag**: @GithubProjects (THE single most impactful amplifier — directly attributed to GitHub Trending for multiple projects)

**Also tag**: @StarHistoryHQ, @trending_repos

**Hashtags**: #opensource #github #buildinpublic

### Platform 5: Reddit (Evening, space 2-3 hours apart)

**Sub 1: r/coolgithubprojects** (~50K members)
- Title: `Code War — Compare GitHub contributions like Google Trends (embeddable SVG)`
- Include screenshot

**Sub 2: r/opensource**
- Title: `I open-sourced Code War — compare GitHub contributions like Google Trends`

**Sub 3: r/webdev**
- Title: `Built a GitHub contribution comparison tool with Cloudflare Workers — here's how`

**Sub 4: r/sideproject**
- Title: `Side project: Code War — compare your GitHub contributions with anyone`

**Sub 5: r/github**
- Title: `Made a tool to compare GitHub contributions between users — embeds in your profile README`

**Rules for all Reddit posts**: Always include screenshot/GIF. Engage with every comment. No marketing language.

### Platform 6: LinkedIn (Evening)

Frame as: "Built something fun — a tool that compares GitHub contributions between developers, Google Trends style. Open source and free."

Tag relevant developer connections. Include screenshot + link.

---

## Phase 2: Hacker News (Day 2-3, ideally Sunday)

**Best time**: Sunday 6-10 AM UTC (2.5x more likely to reach front page)

**Title**: `Show HN: Code War – Compare GitHub contributions like Google Trends`

**Link**: GitHub repo URL (HN prefers repos over marketing sites)

**Top comment** (post immediately):
```
Hey HN, I built Code War because I wanted to see how my GitHub
contributions compare to developers I admire.

It works like star-history.com but for user contributions instead
of repo stars. You add one line of markdown to your profile README
and get a Google Trends-style chart with avatars.

Tech: Cloudflare Workers, GitHub GraphQL API, hand-drawn SVG
rendering with Virgil font (from Excalidraw). Zero auth, no
signup. Chart updates daily via KV caching.

Would love feedback on the chart design and feature ideas.
```

**Tactics**:
- Have 5-10 friends upvote AND comment (comments > upvotes on HN)
- Do NOT send direct links to post (HN detects vote rings — friends find it on /newest)
- If it misses front page: try again in 1-2 weeks (Lago needed 3 attempts)

---

## Phase 3: "Awesome" List Submissions (Day 3-5)

| List | Stars | Action |
|------|-------|--------|
| [abhisheknaiidu/awesome-github-profile-readme](https://github.com/abhisheknaiidu/awesome-github-profile-readme) | 29K | PR to "Tools" section |
| [rzashakeri/beautify-github-profile](https://github.com/rzashakeri/beautify-github-profile) | 12K | PR to "Widgets" category |
| [matiassingers/awesome-readme](https://github.com/matiassingers/awesome-readme) | 18K | PR to "Tools" section |
| [tobimori/awesome-profile-readme](https://github.com/tobimori/awesome-profile-readme) | ~1K | PR to tools section |

**PR format**: `[Code War](https://github.com/stainlu/codewar) - Compare GitHub contributions like Google Trends. Embeddable SVG for profile READMEs.`

---

## Phase 4: Chinese Platforms (Day 3-7)

Write a **separate Chinese article** (not translation — tailor for Chinese audience). No Chinese content in GitHub repo.

| Platform | Section/Tag | Notes |
|----------|------------|-------|
| **掘金 (Juejin)** | 开源, GitHub, 前端, 工具 | Largest Chinese front-end community |
| **V2EX** | "分享创造" section | Tech-savvy, startup-minded |
| **知乎** | Answer: "有哪些好用的GitHub Profile README工具？" | Q&A, high SEO |
| **SegmentFault** | 开源项目 | Chinese dev Q&A |
| **CSDN** | 开源, GitHub | Largest Chinese dev platform by traffic |
| **InfoQ China** | Community article | Enterprise/senior dev audience |

**Must write in Chinese** — English posts get minimal engagement.

---

## Phase 5: Product Hunt (Day 7-14)

**Best time**: 12:01 AM Pacific Time, Tuesday-Thursday

**Prep**:
- Create PH maker page
- 5 screenshots + 1 GIF demo
- Tagline: "Compare GitHub contributions like Google Trends"
- Line up 5-10 hunters/supporters

**Launch day**: Share PH link on Twitter + Dev.to. Friends upvote + leave genuine reviews.

OSS tools regularly hit #1 Product of the Day.

---

## Phase 6: Developer Discord & Slack Communities (Day 3-10)

| Community | Channel | Framing |
|-----------|---------|---------|
| **Reactiflux** Discord | #show-off | "Built a GitHub comparison tool" |
| **TypeScript** Discord | #showcase | TypeScript project |
| **Cloudflare Workers** Discord | #showcase | Workers project, tag CF devrel |
| **The Programmer's Hangout** | #showcase | General dev audience |
| **Indie Hackers** | Forum post | Side project / maker story |
| **Lobsters** | Submit link | Similar to HN, invite-only |

**Rules**: Read community rules first. Use #showcase channels. Don't spam.

---

## Phase 7: YouTube & Video Content (Week 2-3)

### Make a 60-90 second demo video
- Screen recording: open codewar.dev → type username → see chart → copy embed → paste in README → done
- Post on YouTube Shorts, Twitter, LinkedIn

### Reach out to GitHub profile YouTubers
Search "customize github profile readme" on YouTube. DM creators with 10K-100K views:
- Eddie Jaoude, Fireship, codeSTACKr, Web Dev Simplified
- "Hey, I built Code War — a new tool for GitHub profiles. Would love if you'd feature it"

Any of these featuring Code War = massive visibility.

---

## Phase 8: Newsletter & Podcast Outreach (Week 2-4)

### Developer Newsletters

| Newsletter | How to submit |
|-----------|---------------|
| **JavaScript Weekly** | cooperpress.com/submit |
| **Node Weekly** | Same publisher |
| **Bytes.dev** | Tweet at @uidotdev |
| **TLDR Newsletter** | tldr.tech/submit |
| **Console.dev** | console.dev/submit |
| **Changelog** | changelog.com/news/submit |
| **Hacker Newsletter** | Curated from HN — get on HN front page first |

### Developer Podcasts
- **Changelog** — "We built a GitHub contribution tool, here's what we learned about the GitHub API"
- **JS Party** — same publisher
- **Indie Hackers Podcast** — maker story angle

---

## Phase 9: SEO & Organic Search (Ongoing)

### Target keywords (write blog posts for):
- "compare github contributions"
- "github contribution comparison tool"
- "github profile readme tools"
- "embed github stats in readme"
- "github contribution trends"

### Tactics:
- Each blog post embeds a Code War chart (backlink + demo)
- codewar.dev landing page should rank for these terms
- Add `<meta>` description and OG tags to codewar.dev

---

## Phase 10: Content Marketing Flywheel (Week 3+)

### Weekly "Code War of the Week"
- Tweet comparing 2-3 famous developers' contributions
- "Who codes more: React team vs. Vue team?" [chart]
- People love comparisons → shares → new users

### Monthly blog posts
- "Top 10 Most Active GitHub Contributors in AI"
- "React vs Vue vs Angular: Who Has More Active Maintainers?"
- "How I Compare to the Top TypeScript Contributors"
- Each post embeds Code War charts

### Seasonal content
- "GitHub Wrapped 2026 — Compare Your Year with the Best"
- "New Year Code War: Set Your Contribution Goals"

---

## Complete Checklist

### Pre-Launch (Today)
- [ ] Rewrite repo README (hero chart, quick start, customization)
- [ ] Set repo description + 20 topics + website URL
- [ ] Create 1280x640 social preview image
- [ ] Re-add chart to your GitHub profile
- [ ] DM 10-20 friends → star + add to their profiles
- [ ] Target: 50-100 stars before public launch

### Day 1 (Launch)
- [ ] Dev.to article
- [ ] Cross-post: Hashnode + Medium
- [ ] Twitter thread (tag @GithubProjects, @StarHistoryHQ)
- [ ] Reddit: r/coolgithubprojects, r/opensource, r/webdev, r/sideproject, r/github
- [ ] LinkedIn post

### Day 2-3
- [ ] Show HN (Sunday morning UTC)
- [ ] Submit to awesome lists (4 PRs)

### Day 3-7
- [ ] Chinese articles: Juejin, V2EX, 知乎, CSDN
- [ ] Discord/Slack communities: Reactiflux, TypeScript, CF Workers
- [ ] Indie Hackers forum post
- [ ] Lobsters submission

### Day 7-14
- [ ] Product Hunt launch
- [ ] Submit to dev newsletters (JS Weekly, TLDR, Console.dev, Changelog)
- [ ] Reach out to 3-5 YouTube creators

### Week 3+
- [ ] Start "Code War of the Week" tweets
- [ ] First blog post with embedded charts
- [ ] Consider podcast outreach

---

## Key Numbers

| Metric | Number |
|--------|--------|
| github-readme-stats: 0 → 1K stars | 8 days |
| GitHub Trending threshold (TypeScript) | ~50-100 stars/day |
| r/coolgithubprojects members | 50K |
| Show HN front page rate | ~4% (persistence matters) |
| Product Hunt: OSS hit rate for #1 | Very high |
| @GithubProjects → GitHub Trending | Directly attributed |
