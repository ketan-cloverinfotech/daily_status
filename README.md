# Daily Status Mail Generator

A web app to draft your daily status email in 30 seconds. Fill the form, click Copy, paste into Outlook.

Built in the same shape as the CoE MoM Generator (React + Vite + Tailwind, deployed via GitHub Pages). 

## What it does

- 8 sections: Header, Completed, In Progress, Tomorrow, Blockers, Meetings, Hours, Leaves
- One-click copy as **rich HTML** — pastes into Outlook with all the table formatting
- Auto-saves to browser `localStorage` (so refreshing doesn't wipe your work)
- Export / Import JSON — useful when you want to "carry forward" yesterday's WIP and blockers
- Empty sections (e.g. Blockers, Meetings, Leaves) are hidden in the email automatically

## Quick deploy to GitHub Pages

### 1. Create a GitHub repo

Go to https://github.com/new and create a **public** repo named `daily-status-mail` (public is required for free GitHub Pages).

### 2. Push the code

```bash
# from inside the unzipped daily-status-mail folder
cd daily-status-mail
git init
git add .
git commit -m "Initial commit - Daily Status Mail Generator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/daily-status-mail.git
git push -u origin main
```

### 3. Enable Pages

1. Repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The workflow auto-runs on push and deploys in ~2 min

### 4. Open the app

```
https://YOUR_USERNAME.github.io/daily-status-mail/
```

## Local dev

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## If you rename the repo

Edit `vite.config.js`:

```js
base: '/your-new-repo-name/',
```

Otherwise the built CSS/JS asset paths break on Pages.

## Customise defaults

Open `src/App.jsx`. Top of file has constants:

- `DEFAULT_REPORTER`, `DEFAULT_PROJECT`, `DEFAULT_TO` — your name, project, manager
- `DEFAULT_GREETING`, `DEFAULT_INTRO`, `DEFAULT_CLOSING` — email salutation/closing

Change them once and they become the seed values for every new day.

## Carry-forward workflow

End of day:

1. Click **⬇ Export JSON** — saves `daily-status-YYYY-MM-DD.json`

Next morning:

1. Click **⬆ Import JSON** — pick yesterday's file
2. WIP and Blockers are carried forward, daily lists (Completed, Meetings, etc.) are reset
3. Date auto-rolls to today

## Common gotchas

- **Copy doesn't paste as table in Outlook desktop** → Some Outlook desktop versions strip rich HTML from `clipboard.write()`. Workaround: open the **iframe preview**, right-click → **Select All** → **Copy**, then paste. Outlook keeps the formatting that way.
- **Clipboard API needs HTTPS** → Works on `https://*.github.io` and `localhost`. Will silently fail on raw `http://` hosts other than localhost.
- **Don't use `npm run deploy`** → That uses `gh-pages` package and conflicts with the GitHub Actions workflow. Just `git push` and let Actions deploy.
