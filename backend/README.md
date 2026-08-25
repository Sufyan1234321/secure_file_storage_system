# Secure File Storage API

## Setup

1. Copy `.env.example` to `.env` and configure MongoDB.
2. Run `npm install`, then `npm run dev`.

Uploaded files are stored in the backend `uploads` folder. MongoDB stores file metadata only. Users can manage their own files; admins can manage all files and view users. Normal deletion moves files to Trash before permanent deletion.

Uploads are limited to 110 MB per file and 5 GB per user. The API allows PDF, Word, text, CSV, JPG, PNG, GIF, and WebP files. It checks the filename, extension, and MIME type before saving the file. MIME type checks are only a quick check because request headers can be spoofed. For production, add magic-byte validation and antivirus scanning before making files public.

### Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/change-password` (JWT)
- `POST /api/files/upload` (multipart field: `file`)
- `GET /api/files`
- `GET /api/files/trash` (JWT)
- `PATCH /api/files/:id`
- `PATCH /api/files/:id/restore` (JWT)
- `DELETE /api/files/:id` (JWT; move to Trash)
- `DELETE /api/files/:id/permanent` (JWT)
- `GET /api/files/:id/download`
- `GET /api/files/share/:shareToken`
- `GET /api/files/users` (admin)

Authentication routes are protected by rate limiting, and the API sends Helmet security headers.
