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

Example:

```bash
ALLOWED_ORIGIN=https://your-frontend.onrender.com,https://your-other-host.com
```

## Endpoints

- `GET /health`
- `GET /api/bootstrap`
- `GET /api/models`
- `GET /api/knowledge`
- `GET /api/policies`
- `GET /api/changelog`
- `GET /api/documentation-links`

`/api/bootstrap` returns data in the same key format expected by current frontend:
- `meta` (`bootstrapVersion`, `loadedAt`)
- `ModelsData`
- `PoliciesData`
- `TroubleshootingData`
- `KnowledgeBaseData`
- `ModelMediaData`
- `ModelPlatformChassisData`
- `DocumentationLinksData`
