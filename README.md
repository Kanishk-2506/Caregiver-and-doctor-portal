# Niramaya — Caregiver &amp; Doctor Portal

A React (Vite) portal for the SIH Dementia Support Platform. It connects to the
same Supabase backend as the patient app, so edits here sync live to the app
(and vice-versa). See [`../INTEGRATION.md`](../INTEGRATION.md) for the full
architecture.

If the backend isn't configured it falls back to local demo data and still runs.

## Stack

- [Vite](https://vite.dev/) + React 18
- Tailwind CSS 3, lucide-react icons
- `@supabase/supabase-js` (Postgres + Realtime + Storage)

## Run locally

```bash
npm install
cp .env.example .env      # then paste your Supabase URL + anon key
npm run dev
```

Vite serves at http://localhost:5173.

### Logging in

- **Caregiver:** the patient's access code — demo `KAML-1234`
- **Doctor:** a doctor access code — demo `DRSH-2024`

Toggle the role on the login screen.

## Other commands

```bash
npm run build     # production build to dist/
npm run preview   # serve the production build
npm run lint      # eslint
```

## Project layout

```
src/
  main.jsx                      app entry
  App.jsx                       PatientProvider + connection gate
  context/PatientProvider.jsx   holds the connected patient (realtime)
  lib/
    supabase.js                 client (reads VITE_SUPABASE_*)
    api.js                      all backend queries
    useCollection.js            live per-patient table hook
  components/niramaya/
    LoginScreen.jsx             caregiver / doctor connect
    AppShell.jsx                role-aware nav
    DashboardView / ReminderVault / MemoryVault / Community / AppSettings   caregiver
    DoctorView.jsx              doctor: performance, clinical review, appointments
```
