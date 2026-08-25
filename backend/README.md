# Secure File Storage API

## Setup

1. Copy `.env.example` to `.env` and configure MongoDB.
2. Run `npm install`, then `npm run dev`.

Uploaded files are stored in the backend `uploads` folder. MongoDB stores file metadata only. Users can manage their own files; admins can view and delete all files.

Uploads are limited to 110 MB. The API allows PDF, Word, text, CSV, JPG, PNG, GIF, and WebP files. It checks the filename, extension, and MIME type before saving the file. MIME type checks are only a quick check because request headers can be spoofed. For production, add antivirus scanning before making files public.

### Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/files/upload` (multipart field: `file`)
- `GET /api/files`
- `PATCH /api/files/:id`
- `DELETE /api/files/:id`
- `GET /api/files/:id/download`
- `GET /api/files/share/:shareToken`
- `GET /api/files/users` (admin)
