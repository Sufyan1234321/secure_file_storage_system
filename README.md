# Secure File Storage

A full-stack file vault built with Express, MongoDB, Multer, React, and Vite.

Users can upload files, organize them into folders, search and filter authorized files, preview supported formats, share public links, rename and move files, and recover deleted files from Trash. Admins can manage all files and view users.

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

## Main features

- JWT authentication with bcrypt password hashing
- Helmet security headers and authentication rate limiting
- Owner-or-admin authorization for file mutations
- Public links using random share tokens
- Folder selection, rename, move, search, and filtering
- Image, PDF, text, and CSV previews
- Upload progress and a 110 MB per-file limit
- 5 GB per-user storage quota
- Trash, restore, and permanent deletion

## API overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/files/upload`
- `GET /api/files`
- `GET /api/files/trash`
- `PATCH /api/files/:id` for visibility, rename, or move
- `PATCH /api/files/:id/restore`
- `DELETE /api/files/:id` to move a file to Trash
- `DELETE /api/files/:id/permanent`
- `GET /api/files/:id/download`
- `GET /api/share/:shareToken`
- `GET /api/files/users` for admins

## Design notes

- Passwords are hashed with bcrypt and sessions use signed JWTs.
- File contents are uploaded by the authenticated backend and saved outside the web root.
- MongoDB stores metadata and never stores file bytes.
- File mutations require authentication and owner-or-admin authorization.
- Deletion first moves metadata to Trash; permanent deletion removes the stored bytes.
- Public links use random share tokens rather than MongoDB IDs.

## Storage note

The current implementation stores file bytes on local disk in `backend/uploads`. The frontend and backend can both be deployed on Render, but use durable object storage for production because many cloud instance disks are ephemeral. See [DEPLOYMENT.md](DEPLOYMENT.md).
