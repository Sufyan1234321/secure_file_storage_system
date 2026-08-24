# Keep - secure file storage

A small full-stack file vault built with Express, MongoDB, Multer, React, and Vite.

## Run locally

### Backend

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Set the MongoDB connection and JWT values in `backend/.env`. Uploaded files are saved in `backend/uploads`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` only if the API is not running at `http://localhost:5000/api`.

## Design notes

- Passwords are hashed with bcrypt and sessions use signed JWTs.
- File contents are uploaded by the authenticated backend and saved outside the web root.
- MongoDB stores metadata and never stores file bytes.
- File mutations require both an authenticated role and ownership; admins can manage all files.
- Public links use random share tokens rather than MongoDB IDs.
