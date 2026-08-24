# Secure File Storage Architecture

## 1. One-minute overview

This is a full-stack file vault. The React/Vite frontend handles authentication and file-management interactions. The Express backend exposes REST endpoints, verifies JWTs, enforces ownership and roles, and coordinates storage. MongoDB stores users and file metadata; uploaded file bytes are stored on the backend filesystem, outside the public web root.

```mermaid
flowchart LR
    Browser[React + Vite frontend]
    API[Express REST API\nCORS + JSON + routes]
    Auth[JWT authentication\nprotect middleware]
    Rules[Authorization\nowner or admin]
    Mongo[(MongoDB\nusers + file metadata)]
    Disk[(backend/uploads\nfile bytes)]

    Browser -->|Axios JSON / multipart| API
    API --> Auth
    Auth --> Rules
    API --> Mongo
    API --> Disk
    Rules --> Mongo
```

## 2. Runtime architecture

```mermaid
flowchart TB
    subgraph Client[Frontend: frontend/src]
        Pages[Login / Register / Dashboard]
        Context[AuthContext\nuser + token lifecycle]
        Axios[Axios API client\nadds Bearer token]
        Pages --> Context
        Pages --> Axios
        Context --> Axios
    end

    subgraph Server[Backend: backend/src]
        Entry[server.js\nconnect DB, listen]
        App[app.js\nCORS, JSON, logging, routes]
        AuthRoutes[auth.routes.js]
        FileRoutes[file.routes.js]
        Middleware[protect / requireRole / Multer]
        Controllers[auth.controller.js\nfile.controller.js]
        Services[auth.service.js\nfile.service.js]
        Models[User + File models]
        Entry --> App
        App --> AuthRoutes
        App --> FileRoutes
        AuthRoutes --> Middleware
        FileRoutes --> Middleware
        Middleware --> Controllers
        Controllers --> Services
        Services --> Models
    end

    Database[(MongoDB)]
    Uploads[(backend/uploads)]
    Axios -->|HTTP| App
    Models --> Database
    Controllers --> Uploads
```

## 3. Authentication flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as React frontend
    participant A as Express API
    participant S as Auth service
    participant DB as MongoDB

    U->>F: Submit register or login form
    F->>A: POST /api/auth/register or /login
    A->>A: Validate request fields
    A->>S: Register or authenticate user
    S->>DB: Find/create User document
    S->>S: Hash password or compare bcrypt hash
    S->>S: Create signed JWT
    S-->>F: user profile + token
    F->>F: Store token in localStorage
    F-->>U: Show dashboard

    F->>A: GET /api/auth/me with Bearer token
    A->>A: Verify JWT and load user
    A-->>F: Current user profile
```

## 4. Secure upload flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Dashboard
    participant M as Multer middleware
    participant C as File controller
    participant DB as MongoDB
    participant FS as uploads directory

    U->>F: Select a file
    F->>M: POST /api/files/upload\n multipart/form-data + JWT
    M->>M: protect verifies JWT
    M->>M: Validate name, extension, MIME type, size
    M->>FS: Write bytes using random UUID filename
    M-->>C: req.file metadata
    C->>DB: Create File metadata with owner ID
    C-->>F: 201 file metadata response
    F->>F: Refresh file list
```

## 5. Download, sharing, and deletion

```mermaid
flowchart TD
    Start{Requested action}
    Start --> Download[Private or owner download]
    Start --> Share[Public share link]
    Start --> Delete[Delete file]
    Start --> Visibility[Change visibility]

    Download --> Verify[protect: verify JWT + load user]
    Verify --> Permission{Public file\nor owner/admin?}
    Permission -->|yes| Send[res.download from uploads]
    Permission -->|no| Deny[403 private file]

    Share --> Token[Find by shareToken + isPublic=true]
    Token -->|found| Send
    Token -->|missing| NotFound[404 shared file not found]

    Delete --> VerifyDelete[protect + owner/admin check]
    VerifyDelete --> RemoveBytes[Delete bytes from uploads]
    RemoveBytes --> RemoveMeta[Delete MongoDB metadata]

    Visibility --> VerifyDelete
    VerifyDelete --> NewToken[Create share token when made public]
    NewToken --> Save[Save isPublic + shareToken]
```

## 6. Request path in the code

```text
Browser
  -> frontend/src/services/api.js
  -> backend/src/app.js
  -> backend/src/routes/*.routes.js
  -> middleware: protect / requireRole / uploadFile
  -> backend/src/controllers/*.controller.js
  -> backend/src/services/*.service.js
  -> backend/src/models/*.model.js
  -> MongoDB and/or backend/uploads
```

### Main endpoints

| Endpoint | Purpose | Protection |
| --- | --- | --- |
| `POST /api/auth/register` | Create account and return JWT | Public + validation |
| `POST /api/auth/login` | Authenticate and return JWT | Public + validation |
| `GET /api/auth/me` | Restore current session | JWT |
| `POST /api/files/upload` | Validate and store a file | JWT |
| `GET /api/files` | List the user's files, or all files for admin | JWT |
| `GET /api/files/:id/download` | Download a file | JWT + public/owner/admin rule |
| `PATCH /api/files/:id` | Toggle public/private visibility | JWT + owner/admin rule |
| `DELETE /api/files/:id` | Delete bytes and metadata | JWT + owner/admin rule |
| `GET /api/share/:shareToken` | Download a public file | Share token + public flag |
| `GET /api/files/users` | List users | JWT + admin role |

## 7. Interview explanation

> I built a React and Express file vault with MongoDB for metadata and filesystem storage for the actual bytes. The frontend uses Axios and stores the JWT returned by login or registration, then sends it as a Bearer token on every API request. On the backend, the `protect` middleware verifies the token and loads the user before protected routes run. Uploads pass through Multer, which validates the filename, MIME type, extension, and maximum size, then stores the file under a random UUID filename. The database stores the original name, storage name, size, MIME type, owner, and sharing state, but never the file contents. For mutations, I enforce both authentication and authorization: the owner can manage their file, while an admin can manage all files. Public sharing uses a random share token instead of exposing a MongoDB ID.

## 8. Design decisions and tradeoffs

- **MongoDB plus filesystem:** metadata queries stay simple and file bytes do not inflate database documents. In production, the filesystem layer could be replaced with object storage such as S3 while keeping the metadata API mostly unchanged.
- **JWT authentication:** the API is stateless and easy for a separate frontend to consume. A production browser deployment would usually consider an HttpOnly, Secure cookie to reduce token exposure to client-side scripts.
- **Random storage filenames:** original names are retained only as metadata, reducing path traversal and collision risks.
- **Backend authorization:** hiding controls in React is only a UI concern; ownership and admin checks are enforced again on the server.
- **Public links:** share tokens avoid exposing database identifiers and are only accepted when the file is marked public.

## 9. Important security note

Do not commit `backend/.env`. Replace any database credential that has been exposed in screenshots, chat, terminal output, or source control, and use a strong random `JWT_SECRET` in real deployments.
