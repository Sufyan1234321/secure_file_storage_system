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

The current backend writes uploaded bytes to `backend/uploads` using Multer. Local disk on many cloud services is ephemeral, so files can disappear after a restart or redeploy.

For a serious deployment, replace the filesystem layer with object storage such as Amazon S3, Cloudflare R2, or Supabase Storage. Keep MongoDB for metadata and store the object key or URL in the `File` document.

For a temporary demo, use a host with a persistent disk and mount it at the upload directory. The current code uses `process.cwd()/uploads`, so configure the service's persistent disk mount accordingly or make the upload directory configurable.

## 5. Production checklist

- Rotate the MongoDB password because credentials should never be shared in screenshots or chat.
- Use a long random `JWT_SECRET`, not the development value.
- Do not commit `backend/.env`.
- Use HTTPS URLs for both frontend and backend.
- Restrict MongoDB network access where possible.
- Move file bytes to durable object storage before relying on the app for real data.
- Test registration, login, private upload, public share, preview, download, delete, and admin access after deployment.

## 6. Interview deployment explanation

> I deploy the React frontend and Express API as two separate Render services. The frontend is a Render Static Site and receives the backend API URL through `VITE_API_URL`. The backend is a Render Web Service and receives the frontend origin through `CLIENT_URL` for CORS. MongoDB Atlas stores users and file metadata. In the current demo, Multer writes file bytes to local disk, but for production I would replace that adapter with durable object storage such as S3 or R2 because cloud instance disks may be ephemeral.

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

The next phases still require implementation: refresh tokens, password reset email delivery, email verification, multi-file upload, nested folder records, private user-to-user sharing, expiring links, audit logs, malware scanning, durable object storage, backups, and automated tests.
