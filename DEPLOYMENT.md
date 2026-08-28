# Deployment Guide

Recommended setup:

- **MongoDB Atlas** for the database
- **Render Web Service** for the Express backend
- **Render Static Site** for the React/Vite frontend

## 1. Prepare MongoDB Atlas

1. Create or use a MongoDB Atlas cluster.
2. Create a database user with a strong password.
3. Add the deployment provider's network access. For a quick demo, Atlas allows `0.0.0.0/0`; restrict this in production when possible.
4. Copy the connection string and include a database name, for example:

```text
mongodb+srv://USER:PASSWORD@cluster.mongodb.net/secure-file-storage?retryWrites=true&w=majority
```

## 2. Deploy the backend on Render

Create a **Web Service** from the repository.

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
|

Add these environment variables in Render:

```text
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/secure-file-storage?retryWrites=true&w=majority
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=1d
CLIENT_URL=https://your-frontend.onrender.com
CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>
```

Render provides a backend URL such as:

```text
https://secure-file-storage-api.onrender.com
```

Check that the API is running:

```text
https://secure-file-storage-api.onrender.com/api/health
```

Expected response:

```json
{"success":true,"message":"API is running"}
```

## 3. Deploy the frontend on Render

Create a **Static Site** from the same repository.

| Setting | Value |
| --- | --- |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
|

Add this environment variable in the Render Static Site environment settings:

```text
VITE_API_URL=https://secure-file-storage-api.onrender.com/api
```

Replace the example domain with the actual Render backend URL, then redeploy the frontend.

Update the backend Render `CLIENT_URL` value to the final frontend Render URL if it changes.

## 4. File storage warning

The backend streams uploaded bytes to Cloudinary using Multer's in-memory storage. MongoDB keeps the searchable metadata plus the Cloudinary public ID, secure URL, and resource type. Set the three Cloudinary environment variables above in the Render backend service; never commit the API secret.

## 5. Production checklist

- Rotate the MongoDB password because credentials should never be shared in screenshots or chat.
- Use a long random `JWT_SECRET`, not the development value.
- Do not commit `backend/.env`.
- Use HTTPS URLs for both frontend and backend.
- Restrict MongoDB network access where possible.
- Keep Cloudinary usage within the account's size, transformation, and bandwidth limits.
- Test registration, login, private upload, public share, preview, download, delete, and admin access after deployment.

## 6. Interview deployment explanation

> I deploy the React frontend and Express API as two separate Render services. The frontend is a Render Static Site and receives the backend API URL through `VITE_API_URL`. The backend is a Render Web Service and receives the frontend origin through `CLIENT_URL` for CORS. MongoDB Atlas stores users and file metadata, while Cloudinary stores and delivers the file bytes independently of the web service disk.

## 7. Current implementation status

The first production foundation phase now includes:

- Helmet security headers
- Authentication rate limiting
- Authenticated password changes
- File rename and move through `PATCH /api/files/:id`
- Soft-delete trash through `DELETE /api/files/:id`
- Trash listing through `GET /api/files/trash`
- Restore through `PATCH /api/files/:id/restore`
- Permanent deletion through `DELETE /api/files/:id/permanent`
- Normal file listings exclude trashed files

The next phases still require implementation: refresh tokens, password reset email delivery, email verification, nested folder records, private user-to-user sharing, expiring links, audit logs, malware scanning, backups, and automated tests.
