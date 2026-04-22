# CallCenter Backend

Express API for Support Hub data bootstrap.

## Local Run

1. Install dependencies:

```bash
npm install
```

2. Run server:

```bash
npm start
```

Server starts on `http://localhost:4000` by default.

## Environment Variables

- `PORT` - API port (default `4000`)
- `ALLOWED_ORIGIN` - CORS origin (`*` or comma-separated origins)
- `ADMIN_CREDENTIALS` - comma-separated `username:password` pairs for admin login
- `ADMIN_TOKEN_SECRET` - HMAC secret for admin bearer tokens
- `ADMIN_TOKEN_TTL_MINUTES` - token lifetime in minutes (default `720`, one year `525600`)

Example:

```bash
ALLOWED_ORIGIN=https://your-frontend.onrender.com,https://your-other-host.com
ADMIN_CREDENTIALS=CallCenterAdmin:TPV11112222,manager:another-strong-password
ADMIN_TOKEN_SECRET=replace-with-long-random-secret
ADMIN_TOKEN_TTL_MINUTES=525600
```

## Generate admin token

Generate token for default admin user:

```bash
npm run admin:token
```

Generate token for specific user and TTL minutes (example: one year):

```bash
npm run admin:token -- CallCenterAdmin 525600
```

## Endpoints

- `GET /health`
- `GET /`
- `GET /api/bootstrap`
- `GET /api/models`
- `GET /api/knowledge`
- `GET /api/policies`
- `GET /api/changelog`
- `GET /api/documentation-links`
- `POST /api/admin/login`
- `GET /api/admin/session`
- `GET /api/admin/models`
- `GET /api/admin/models/:modelName`
- `POST /api/admin/models`
- `PUT /api/admin/models/:modelName`
- `PATCH /api/admin/models/:modelName/unset`
- `DELETE /api/admin/models/:modelName`

Admin web UI is served from:
- `/admin/`

## Media Mirroring (recommended)

To avoid relying on third-party image availability, mirror Philips media assets into backend storage:

```bash
npm run mirror-media
```

This downloads image URLs from `data/model-media.js` into:
- `backend/public/media/philips/*`
- `backend/public/media/manifest.json`

When manifest entries exist, API responses rewrite `frontImageUrl`, `sideImageUrl`,
`remoteImageUrl`, and `portsImageUrl` to backend-hosted URLs automatically.

`/api/bootstrap` returns data in the same key format expected by current frontend:
- `meta` (`bootstrapVersion`, `loadedAt`)
- `ModelsData`
- `PoliciesData`
- `TroubleshootingData`
- `KnowledgeBaseData`
- `ModelMediaData`
- `ModelPlatformChassisData`
- `DocumentationLinksData`
