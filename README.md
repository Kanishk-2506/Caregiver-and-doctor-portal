# SmritiSetu — Caregiver Portal

A single-page React prototype for a dementia-caregiver portal (dashboard, memory
vault, reminder vault, app settings, SOS call). Everything runs in the browser
with mock data — there is no backend.

## Stack

- [Vite](https://vite.dev/) + React 18
- Tailwind CSS 3
- lucide-react icons

## Run locally

```bash
npm install
npm run dev
```

Vite serves the app at http://localhost:5173 (opens automatically).

On the login screen, enter **any 8-digit code** to enter the portal.

## Other commands

```bash
npm run build     # production build to dist/
npm run preview   # serve the production build
npm run lint      # eslint
```

## Project layout

```
index.html
src/
  main.jsx                     app entry
  App.jsx                      login screen <-> app shell
  index.css                    Tailwind directives, theme vars, animations
  components/smritisetu/       all screens and widgets
```
