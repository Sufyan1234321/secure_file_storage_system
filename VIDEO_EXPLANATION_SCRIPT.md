# Secure File Storage Project: Video Explanation Script

## Target length

Aim for 5 to 7 minutes. Keep the browser and code editor visible, and show the application working before explaining implementation details.

## Walkthrough order

Use this order in the recording:

1. Show the dashboard and explain the product in one sentence.
2. Register or log in and explain JWT authentication.
3. Upload one private file into an existing folder.
4. Upload a second file into the same folder and show the progress bar.
5. Search by filename and filter by folder.
6. Preview and download the file.
7. Make the file public, copy the link, and open it in an incognito window.
8. Rename and move the file.
9. Move it to Trash, restore it, and explain permanent deletion.
10. Show the architecture diagram and deployment setup.

Keep the demo focused on one or two small files so the workflow is easy to follow.

## 0. Opening: 20 seconds

**Show:** The dashboard home screen.

**Say:**

> This is my Secure File Storage System. It is a full-stack file vault where users can register, log in, upload files, organize them into folders, search and filter files, preview supported formats, download files, and share selected files with a public link. The system also supports admin access and ownership-based authorization.

## 1. Architecture: 35 seconds

**Show:** The architecture diagram in `ARCHITECTURE.md`.

**Say:**

> The application has three main parts. The frontend is built with React and Vite. The backend is an Express REST API with Helmet security headers and authentication rate limiting. MongoDB stores users and file metadata, while the actual file bytes are stored in the backend uploads directory. The frontend communicates with the API using Axios.

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

**Also mention:** The backend includes `POST /api/auth/change-password`, which verifies the current password before replacing its bcrypt hash.

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

> The dashboard provides client-side search by file name and folder name. It also filters by folder and access level from the left sidebar. The API first returns only files the current user is allowed to see, and the frontend applies these display filters to that authorized result set. The sidebar also shows storage used against the 5 GB per-user quota.

**Demonstrate:**

- Search for part of a filename.
- Select a folder from the folder filter.
- Use the sidebar to switch between `My files`, `Shared`, and `Only me`.

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

**Show:** Rename and Move modals, then the Trash view and admin view if available.

**Say:**

> Rename and Move use custom modals and send updates through the authorized file endpoint. Delete also uses a custom confirmation modal. The first delete is a soft delete: the backend marks the file as trashed, removes its public access, and hides it from the normal list. From Trash, the user can restore the file or permanently delete its bytes and metadata.
>
> Administrators can view all files and access the user list. Regular users can only see and manage their own files. This is role-based access control enforced on the server.

**Demonstrate:** Rename a file, move it to another folder, open Trash, restore it, and show the `Delete forever` action.

## 9. Deployment and closing: 35 seconds

**Show:** `DEPLOYMENT.md` or deployment dashboard.

**Say:**

> For deployment, I use MongoDB Atlas for the database and Render for both application services. The Express backend runs as a Render Web Service, and the React frontend runs as a Render Static Site. The frontend receives the backend URL through `VITE_API_URL`, and the backend receives the frontend origin through `CLIENT_URL` for CORS.
>
> The current demo stores files on local disk. For production, I would replace that storage adapter with durable object storage such as Amazon S3, Cloudflare R2, or Supabase Storage, because cloud instance disks can be ephemeral.

## 10. Current implementation status

**Say:**

> The implemented foundation includes authentication, JWT authorization, admin role checks, rate limiting, security headers, file validation, folder organization, search and filters, previews, public links, a 5 GB storage quota, rename and move, and a Trash workflow. Future production work would include refresh tokens, password reset email delivery, email verification, magic-byte validation, malware scanning, durable object storage, audit logs, notifications, backups, and automated tests.

## Reviewer test checklist

Ask reviewers to try these scenarios:

- Register with a valid password, log out, and log in again.
- Try to register the same email twice and confirm the duplicate is rejected.
- Open a protected API endpoint without a token and confirm it returns `401`.
- Upload an allowed file and an unsupported file type.
- Upload a file larger than 110 MB or exceed the 5 GB account quota.
- Choose an existing folder and confirm multiple files appear in it.
- Search by filename and folder, then use the sidebar access filters.
- Preview an image or PDF and download it with its original filename.
- Make a file public, copy the link, and open it without logging in.
- Make the file private again and confirm the old public link stops working.
- Rename and move a file, then refresh the page and confirm the changes persist.
- Move a file to Trash, restore it, and permanently delete it.
- Confirm one user cannot manage another user’s private file.
- Confirm only an admin can access the user list.

## Key decisions to explain

- **Metadata and bytes are separate:** MongoDB stores searchable metadata; the local uploads directory stores file bytes.
- **JWT plus database lookup:** the JWT identifies the user, while the backend reloads the current user and role before authorization.
- **Owner-or-admin permissions:** the backend enforces ownership for file mutations; frontend controls are not treated as security.
- **Random storage names:** UUID filenames prevent collisions and avoid using user-provided names as filesystem paths.
- **Public share tokens:** public links use random tokens and require `isPublic: true`; changing a file back to private revokes access.
- **Soft delete first:** normal delete moves a file to Trash, allowing restore; permanent deletion removes both bytes and metadata.
- **Quota enforcement on the server:** the backend calculates stored file sizes and rejects uploads that would exceed 5 GB.
- **Render deployment:** the frontend is a Render Static Site and the backend is a Render Web Service, with URLs connected through environment variables.

## Closing summary

End the video with:

> The main flow is authenticated upload, validated storage, authorized file access, and controlled sharing. The main design decisions are separating metadata from file bytes, enforcing permissions on the backend, using random storage names and share tokens, and providing Trash recovery before permanent deletion. Reviewers can test the system through the normal user workflow, protected endpoints, public links, quota handling, and admin-only operations.

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
