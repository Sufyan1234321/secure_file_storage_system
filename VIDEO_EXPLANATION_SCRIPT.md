# Secure File Storage Project: Video Explanation Script

## Target length

Aim for 5 to 7 minutes. Keep the browser and code editor visible, and show the application working before explaining implementation details.

## 0. Opening: 20 seconds

**Show:** The dashboard home screen.

**Say:**

> This is my Secure File Storage System. It is a full-stack file vault where users can register, log in, upload files, organize them into folders, search and filter files, preview supported formats, download files, and share selected files with a public link. The system also supports admin access and ownership-based authorization.

## 1. Architecture: 35 seconds

**Show:** The architecture diagram in `ARCHITECTURE.md`.

**Say:**

> The application has three main parts. The frontend is built with React and Vite. The backend is an Express REST API. MongoDB stores users and file metadata, while the actual file bytes are stored in the backend uploads directory. The frontend communicates with the API using Axios.

```text
React/Vite frontend
        |
        | HTTP + JWT
        v
Express REST API
     /       \
MongoDB    uploads directory
metadata   file bytes
```

## 2. Registration and login: 45 seconds

**Show:** Register page, then login page.

**Say:**

> A new user registers with a name, email, and password. The backend validates the request, checks whether the email already exists, hashes the password with bcrypt, and stores the user in MongoDB. The password is never stored as plain text.
>
> After registration or login, the server creates a signed JWT containing the user ID and role. The frontend stores that token locally and sends it as a Bearer token with future API requests.

**Show in code:**

- `backend/src/routes/auth.routes.js`
- `backend/src/services/auth.service.js`
- `backend/src/utils/generateToken.js`
- `frontend/src/context/AuthContext.jsx`

## 3. Authentication and authorization: 45 seconds

**Show:** The dashboard while logged in, then the protected route code.

**Say:**

> Authentication answers who the user is. Authorization answers what that user is allowed to do. The `protect` middleware reads the Bearer token, verifies the JWT signature, loads the current user from MongoDB, and places that user on the request.
>
> For file mutations, the backend checks that the user is the file owner or an administrator. The frontend can hide controls for convenience, but the real security check always happens on the backend.

**Show in code:**

- `backend/src/middleware/auth.middleware.js`
- `backend/src/middleware/role.middleware.js`
- `backend/src/controllers/file.controller.js`

## 4. Upload and folder organization: 60 seconds

**Show:** Click `Add a file`, choose a small PDF or image, and show the custom upload modal.

**Say:**

> When a user selects a file, the application asks whether it should be public or private. It also lets the user select an existing folder or create a new folder. This makes it easy to upload multiple files into the same folder.
>
> On the backend, Multer validates the filename, extension, MIME type, and maximum size. The file is written with a random UUID filename, while MongoDB stores the original name, folder, size, MIME type, owner, and visibility information. MongoDB stores metadata only, not the file bytes.

**Demonstrate:**

1. Choose `Work` from the folder dropdown.
2. Choose `Keep private`.
3. Upload another file into `Work`.
4. Show both files together.
5. Show the upload progress bar.

**Show in code:**

- `frontend/src/pages/Dashboard.jsx`
- `backend/src/middleware/upload.middleware.js`
- `backend/src/models/file.model.js`

## 5. Search and filtering: 30 seconds

**Show:** Search box, folder dropdown, and access tabs.

**Say:**

> The dashboard provides client-side search by file name and folder name. It also filters by folder and access level. The API first returns only files the current user is allowed to see, and the frontend applies these display filters to that authorized result set.

**Demonstrate:**

- Search for part of a filename.
- Select a folder.
- Select `Only me` or `Anyone with link` using the access tabs.

## 6. Preview and download: 35 seconds

**Show:** Click `Preview` on an image or PDF, then click download.

**Say:**

> Preview uses the same protected download endpoint, so private files still require authentication and authorization. Images, PDFs, text, and CSV files open in the preview modal. Other formats can be downloaded instead. The server sends the file from storage using the original filename.

## 7. Public sharing: 50 seconds

**Show:** Change a file from `Only me` to `Make public`, then click `Copy link`.

**Say:**

> To share a file, the owner clicks `Make public`. The backend generates a random share token and stores it with the file metadata. The user can then click `Copy link` and send that URL to another person.
>
> The recipient does not need an account. The public endpoint looks up the random token and confirms that `isPublic` is true before sending the file. If the owner clicks `Make private`, the token is removed and the old link stops working.

**Demonstrate:**

1. Click `Make public`.
2. Click `Copy link`.
3. Open the link in an incognito window.
4. Download the file.
5. Return to the app and click `Make private`.
6. Explain that the old link is now invalid.

## 8. Delete and admin role: 40 seconds

**Show:** Delete modal, then admin view if available.

**Say:**

> Delete also uses a custom confirmation modal so the user clearly understands the action. The backend first checks ownership or admin permission, removes the physical file, and then removes the MongoDB metadata.
>
> Administrators can view all files and access the user list. Regular users can only see and manage their own files. This is role-based access control enforced on the server.

## 9. Deployment and closing: 35 seconds

**Show:** `DEPLOYMENT.md` or deployment dashboard.

**Say:**

> For deployment, I use MongoDB Atlas for the database, Render for the Express backend, and Vercel for the React frontend. The frontend receives the backend URL through `VITE_API_URL`, and the backend receives the frontend origin through `CLIENT_URL` for CORS.
>
> The current demo stores files on local disk. For production, I would replace that storage adapter with durable object storage such as Amazon S3, Cloudflare R2, or Supabase Storage, because cloud instance disks can be ephemeral.

## Common interview questions

### Why MongoDB for files?

> MongoDB stores searchable metadata and ownership relationships. Keeping file bytes separate avoids putting large binary content into database documents.

### Why use JWT?

> JWT makes the API stateless and allows the separate React frontend to authenticate requests. The backend still loads the current user from the database for authorization decisions.

### How do you protect private files?

> The download endpoint requires a valid JWT, then checks whether the file is public or belongs to the current user or an admin. The file path is generated from a server-created storage filename, not directly from user input.

### How do public links work?

> Public links use a random share token. The server requires both a matching token and `isPublic: true`, so switching a file back to private immediately disables the link.

### What would you improve next?

> I would move file bytes to durable object storage, add refresh-token or HttpOnly-cookie authentication, add automated tests, add virus scanning, and add pagination for large file collections.

## Final sentence

> The main design principle is that the frontend provides a simple user experience, while the backend remains responsible for validation, authentication, authorization, and secure file access.
