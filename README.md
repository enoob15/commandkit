# CommandKit 🛠️

**Turn any CLI tool into beautiful, interactive documentation**

Stop writing docs. Start showing commands.

## The Problem

You built an amazing CLI tool. Users love what it does, but they can't figure out **how** to use it. Traditional docs are static, boring, and quickly outdated. Man pages are from 1971. 

Your tool deserves better.

## The Solution

CommandKit automatically generates beautiful, interactive documentation from your CLI tool's help output and usage examples.

- **Interactive Examples:** Users can modify parameters and see commands update live
- **Copy-Paste Ready:** Every command is one-click copyable
- **Auto-Generated:** Parses your CLI's help output automatically
- **Embed Anywhere:** Drop-in widget for your docs, README, or website
- **Zero Maintenance:** Updates automatically when your CLI changes

## Features

### 🚀 Instant Generation
```bash
# Just point CommandKit at your CLI
commandkit generate ./my-tool --help
# Beautiful docs in 30 seconds
```

### 🎯 Interactive Playground  
Users can:
- Toggle flags on/off
- Fill in parameters with real values
- See command output previews
- Copy commands to clipboard

### 📦 Embeddable Widget
```html
<script src="https://commandkit.com/widget.js" 
        data-tool="my-cli" 
        data-command="install"></script>
```

### 📊 Usage Analytics
- Which commands are most popular?
- Where do users get stuck?
- Track copy-to-clipboard events

## Examples

### Before (Traditional)
```
USAGE: mycli [OPTIONS] COMMAND

COMMANDS:
  deploy    Deploy application
  logs      Show application logs
  
OPTIONS:
  --env     Environment (dev|prod)
  --force   Force deployment
```

### After (CommandKit)
- Interactive toggles for `--env` and `--force`
- Dropdown to select environment  
- Real-time command preview: `mycli deploy --env=prod`
- One-click copy button
- Syntax highlighting
- Usage examples with real data

## Revenue Model

- **Free:** 1 CLI tool, basic docs, CommandKit branding
- **Pro ($19/mo):** Unlimited tools, custom domain, analytics, API access
- **Team ($49/mo):** Multiple users, private docs, white-label embed

## Target Market

1. **Open Source Maintainers** — Better docs = more adoption
2. **Developer Tool Companies** — Reduce support burden
3. **Enterprise Teams** — Internal CLI documentation
4. **API-First Companies** — CLI + API docs in one place

## Competition

- **Traditional docs:** Static, manual, outdated
- **Man pages:** Ancient format, not web-friendly
- **Gitiles/Sphinx:** Requires manual writing
- **README examples:** Copy-paste hell

CommandKit is the only tool that generates **interactive** CLI documentation automatically.

## Tech Stack

- **Frontend:** Next.js 16 + React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + Framer Motion
- **CLI Parser:** Node.js + yargs-parser
- **Hosting:** Vercel + Edge Functions
- **Database:** Supabase (usage analytics)

## Development

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

Built during Alice's 4AM Creation Shift on 2026-03-27.

---

**"Stop writing docs. Start showing commands."** 📖→⚡