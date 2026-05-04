import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: `base` must match your GitHub repo name exactly (case-sensitive)
// If your repo is github.com/YOU/daily-status-mail, keep this as is.
// If you rename the repo, change `base` to '/your-repo-name/'.
export default defineConfig({
  plugins: [react()],
  base: '/daily-status-mail/',
})
