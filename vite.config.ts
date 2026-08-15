import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Must match the GitHub repo name — the site is served from
  // https://<user>.github.io/sailing-101/, not the domain root.
  base: '/sailing-101/',
})
