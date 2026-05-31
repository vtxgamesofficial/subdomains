# vtxgames.co.uk — Free Game Subdomains

Get a free `yourgame.vtxgames.co.uk` subdomain for your game project.

> Inspired by [js.org](https://js.org). Powered by Cloudflare + GitHub Actions.

---

## How to claim a subdomain

### Step 1 — Host your game

Get your game online first. Works with:
- **GitHub Pages** → `yourusername.github.io/yourgame`
- **Vercel** → `yourproject.vercel.app`
- **Netlify** → `yourproject.netlify.app`
- **VPS / custom server** → your IP address (use an A record)

Your page must have real content — no placeholder or "coming soon" pages.

### Step 2 — Fork this repo

Fork this repository to your own GitHub account.

### Step 3 — Add your domain file

Create a new file in the `domains/` folder named `yourgame.json`:

```json
{
  "subdomain": "yourgame",
  "owner": {
    "github": "yourgithubusername"
  },
  "record": {
    "type": "CNAME",
    "value": "yourusername.github.io"
  },
  "description": "A short description of your game (1-2 sentences)"
}
```

**For a VPS or custom server**, use an A record instead:

```json
{
  "subdomain": "yourgame",
  "owner": {
    "github": "yourgithubusername"
  },
  "record": {
    "type": "A",
    "value": "123.456.789.0"
  },
  "description": "A short description of your game"
}
```

**Rules for picking a subdomain:**
- Must match your game name as closely as possible
- Lowercase letters, numbers, and hyphens only (e.g. `my-game`, `spaceshooter2`)
- No impersonation of existing games or brands

### Step 4 — Open a pull request

Open a PR from your fork back to this repo. The automated validator will check your file. Once approved and merged, your subdomain will go live within a few minutes.

---

## Rules

To keep this service fair and useful for everyone:

- ✅ Must be a **game** (not a portfolio, blog, or unrelated project)
- ✅ Must have **real content** — no empty or placeholder pages
- ✅ Subdomain must **match your game name**
- ❌ No redirects away from the subdomain without user interaction
- ❌ No illegal, harmful, or offensive content
- ❌ No impersonation of existing games or brands

We reserve the right to remove subdomains that violate these rules.

---

## What happens after your PR is merged?

1. GitHub Actions runs `scripts/sync-dns.js`
2. It creates a CNAME (or A) record on Cloudflare for `yourgame.vtxgames.co.uk`
3. DNS propagates within minutes
4. If using GitHub Pages, add `yourgame.vtxgames.co.uk` as a custom domain in your repo settings

---

## Already have a subdomain?

To update your record (e.g. you moved hosting), simply edit your `domains/yourgame.json` file and open a new PR.

To remove your subdomain, open a PR that deletes your file.

---

## Schema reference

| Field | Required | Description |
|---|---|---|
| `subdomain` | ✅ | Your chosen subdomain (must match filename) |
| `owner.github` | ✅ | Your GitHub username |
| `record.type` | ✅ | `CNAME` or `A` |
| `record.value` | ✅ | The target hostname or IP |
| `description` | ✅ | Short description of your game |
