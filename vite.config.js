import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build identity: CI (GitHub Actions) and Vercel both expose the commit SHA.
// The Android app compares its own build to the latest published APK's to
// answer "is there an update?". Local dev builds get 'dev'.
const sha = process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA || ''

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_ID__: JSON.stringify(sha ? sha.slice(0, 7) : 'dev'),
  },
})
