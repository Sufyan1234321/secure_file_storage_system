# Secure File Storage API

## Setup

1. Copy `.env.example` to `.env` and configure MongoDB.
2. Run `npm install`, then `npm run dev`.

Uploaded file bytes are stored in Cloudinary. MongoDB stores file metadata and the Cloudinary public ID, delivery URL, and resource type. Users can manage their own files; admins can manage all files and view users. Normal deletion moves files to Trash before permanent deletion.

Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `.env` using the values from the Cloudinary dashboard. The server uses an in-memory Multer buffer and streams each upload directly to Cloudinary, so new uploads do not depend on local disk.

Uploads are limited to 110 MB per file and 5 GB per user. The API allows PDF, Word, text, CSV, JPG, PNG, GIF, WebP, and common video files. It checks the filename, extension, and MIME type before sending the file to Cloudinary. MIME type checks are only a quick check because request headers can be spoofed. For production, add magic-byte validation and antivirus scanning before making files public.

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
