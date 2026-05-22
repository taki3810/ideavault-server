# IdeaVault Server

Express + MongoDB + JWT backend for IdeaVault.

## Run Locally

```bash
npm install
cp .env.example .env
npm run dev
```

## Main APIs

- `POST /jwt`
- `GET /ideas`
- `GET /ideas/:id`
- `POST /ideas`
- `PATCH /ideas/:id`
- `DELETE /ideas/:id`
- `GET /my-ideas?email=`
- `GET /comments/idea/:ideaId`
- `POST /comments`
- `PATCH /comments/:id`
- `DELETE /comments/:id`
- `GET /my-interactions?email=`

