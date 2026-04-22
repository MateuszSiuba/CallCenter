# Render Deployment Guide

This guide deploys the backend API on Render and connects the existing frontend.

## 1. Deploy backend on Render

1. Push your current branch to GitHub.
2. In Render dashboard click **New +** -> **Web Service**.
3. Select this repository.
4. Render should auto-detect settings from `render.yaml`.
5. Confirm service name and create.
6. Wait for first deploy.

If Render ignores `render.yaml` or reuses old service settings, set these manually in service settings:
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

After deploy, verify:
- `https://YOUR-BACKEND.onrender.com/health`
- `https://YOUR-BACKEND.onrender.com/api/bootstrap`

## 2. Configure CORS

In Render service -> **Environment** add:

- `ALLOWED_ORIGIN=https://YOUR-FRONTEND-DOMAIN`
- `ADMIN_CREDENTIALS=admin:SET-STRONG-PASSWORD`
- `ADMIN_TOKEN_SECRET=SET-LONG-RANDOM-SECRET`
- `ADMIN_TOKEN_TTL_MINUTES=525600`

You can provide multiple domains separated by commas.

## 3. Point frontend to backend

Add this snippet in `index.html` before loading `app.js`:

```html
<script>
  window.SupportHubConfig = {
    apiBaseUrl: "https://YOUR-BACKEND.onrender.com"
  };
</script>
```

If this config is missing, frontend still works from local in-browser data fallback.

## 4. Smoke test

1. Open frontend.
2. Search a model.
3. Confirm troubleshooting and manuals still load.
4. If backend is unreachable, app should still work from fallback data.

## 5. Admin panel

1. Open `https://YOUR-BACKEND.onrender.com/admin/`.
2. Login using credentials from `ADMIN_CREDENTIALS`.
3. Add/edit/delete models and use field-path delete for nested keys (for example `specs.remote`).
