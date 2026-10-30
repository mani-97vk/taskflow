# TaskFlow — Collaborative Project Management Platform

TaskFlow is a modern, high-performance, collaborative SaaS project management web application inspired by Linear, Asana, and Trello. It provides real-time multi-user task boards, workspaces, role-based access control, task checklists, file attachments, collaborative discussions, activity tracking, notifications, and analytics with CSV exports.

---

## 1. Project Overview

TaskFlow enables engineering and product teams to streamline workflows through:
- **Multi-tenant Workspaces**: Separate environments for distinct organizations, teams, or clients.
- **Projects & Roadmaps**: Project keys, custom statuses, priorities, deadlines, and progress analytics.
- **Kanban Task Boards**: Smooth drag-and-drop task movements powered by `@hello-pangea/dnd`, persistent column ordering, and customizable board columns.
- **Comprehensive Task Details**: Checklists with real-time completion tracking, file attachments with security filters, multi-assignees, due dates, and discussion threads.
- **Real-Time Collaboration**: Instant bidirectional synchronization via Socket.IO for task mutations, comments, and notifications across workspace/project rooms.
- **Analytics & Reports**: Visual status & priority distributions using Recharts, workload breakdown per team member, and CSV data export with spreadsheet formula-injection prevention.
- **Dark/Light Theme**: Native theme switcher supporting Light, Dark, and System modes with zero layout shift.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Lucide React Icons
- **State & Server Cache**: TanStack React Query v5
- **Routing**: React Router v7
- **Forms & Validation**: React Hook Form + Zod
- **Drag & Drop**: `@hello-pangea/dnd`
- **Charts & Visualizations**: Recharts
- **Toast Notifications**: Sonner
- **Real-Time Client**: Socket.IO Client

### Backend
- **Runtime**: Node.js (v20+ / v25+) + TypeScript
- **HTTP Framework**: Express 4
- **Database**: MongoDB with Mongoose ODM
- **Real-Time Engine**: Socket.IO with token-based room authorization
- **Authentication**: JWT stored in secure HTTP-only cookies and Authorization headers
- **Password Security**: Bcrypt with 12 salt rounds
- **Security Middleware**: Helmet, CORS, Express-Rate-Limit, central error handler
- **File Uploads**: Multer disk storage with MIME/extension whitelist and 10MB limits

---

## 3. Monorepo Structure

```text
taskflow/
├── client/                      # React TypeScript frontend
│   ├── src/
│   │   ├── api/                 # Axios client and API endpoints
│   │   ├── components/          # Reusable UI, Kanban, task modals, layout
│   │   ├── context/             # Auth, Workspace, Socket, Theme contexts
│   │   ├── pages/               # Dashboard, Tasks, Projects, Inbox, Settings, Reports
│   │   ├── types/               # Frontend TypeScript interfaces
│   │   └── utils/               # Styling and formatting helpers
│   ├── index.html
│   └── package.json
├── server/                      # Express TypeScript backend
│   ├── src/
│   │   ├── config/              # Environment, DB, and constants
│   │   ├── controllers/         # Business logic for all 12 domains
│   │   ├── middleware/          # Auth, RBAC, Zod validator, rate limit, upload
│   │   ├── models/              # Mongoose data models
│   │   ├── routes/              # Express API routers
│   │   ├── scripts/             # Database seed script
│   │   ├── services/            # Activity, notification, and email helpers
│   │   ├── sockets/             # Socket.IO room and event handlers
│   │   ├── tests/               # Supertest + Vitest integration tests
│   │   ├── utils/               # Password, JWT, CSV generation
│   │   ├── app.ts               # Express application configuration
│   │   └── server.ts            # HTTP & Socket.IO server entrypoint
│   └── package.json
├── .env.example                 # Root environment template
├── .gitignore                   # Monorepo ignore configuration
├── package.json                 # Unified monorepo run scripts
└── README.md                    # Project documentation
```

---

## 4. Prerequisites

1. **Node.js**: v18.0.0 or higher (v20+ recommended).
2. **npm**: v9.0.0 or higher.
3. **MongoDB**: Local MongoDB instance running on `localhost:27017` OR a MongoDB Atlas cluster URI.

---

## 5. Environment Configuration

### Backend (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/taskflow
CLIENT_URL=http://localhost:5173
JWT_SECRET=dev_jwt_secret_taskflow_super_secure_key_2026_change_in_production
SESSION_SECRET=dev_session_secret_taskflow_collaborative_saas_2026
COOKIE_SECURE=false
UPLOAD_DIR=uploads
```

### Frontend (`client/.env`)
Copy `client/.env.example` to `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 6. Installation & Quick Start

### Step 1: Install all dependencies
From the `taskflow` root directory:
```bash
npm run install:all
```
*(Or install inside `server` and `client` individually via `cd server && npm install`, then `cd ../client && npm install --legacy-peer-deps`)*

### Step 2: Seed the Database
Populate demo users, workspaces, projects, Kanban tasks, comments, and activity:
```bash
npm run seed
```
**Seed Demo Accounts:**
- **Email:** `alex@taskflow.dev` | **Password:** `Password123!` (Owner / Product Lead)
- **Email:** `sarah@taskflow.dev` | **Password:** `Password123!` (Admin / Frontend Lead)

### Step 3: Run the Development Server
Run both backend and frontend concurrently from root:
```bash
npm run dev
```
- Backend starts at: `http://localhost:5000`
- Frontend starts at: `http://localhost:5173`

Or run them individually in separate terminals:
```bash
# Terminal 1 - Backend API & Sockets
npm run dev:server

# Terminal 2 - Frontend Client
npm run dev:client
```

---

## 7. Running Automated Tests

Run the full automated test suite (backend API integration + frontend component tests):
```bash
npm test
```

Or run individually:
```bash
# Server API integration tests (21 tests)
npm run test:server

# Frontend component & UI tests (7 tests)
npm run test:client
```

---

## 8. Production Builds

To build optimized production assets for both frontend and backend:
```bash
npm run build
```
Outputs:
- Backend: `server/dist/`
- Frontend: `client/dist/`

To run the production backend server:
```bash
cd server && npm start
```

---

## 9. API Reference Summary

### Health
- `GET /api/health` — Application uptime and database connection status.

### Authentication
- `POST /api/auth/register` — Create account and auto-generate default workspace.
- `POST /api/auth/login` — Sign in, verify password, return JWT & set cookie.
- `POST /api/auth/logout` — Clear session cookie.
- `GET /api/auth/me` — Return authenticated user profile and workspaces.
- `POST /api/auth/forgot-password` — Generate secure password-reset token.
- `POST /api/auth/reset-password` — Apply new password using token.

### Workspaces
- `GET /api/workspaces` — List workspaces current user is member of.
- `POST /api/workspaces` — Create new workspace.
- `GET /api/workspaces/:workspaceId` — Retrieve workspace details.
- `PATCH /api/workspaces/:workspaceId` — Update workspace details (Admin/Owner).
- `DELETE /api/workspaces/:workspaceId` — Cascade delete workspace (Owner only).
- `GET /api/workspaces/:workspaceId/members` — List members and roles.
- `POST /api/workspaces/:workspaceId/invitations` — Generate invitation token.
- `POST /api/workspaces/invitations/:token/accept` — Accept invitation.
- `PATCH /api/workspaces/:workspaceId/members/:userId` — Change member role.
- `DELETE /api/workspaces/:workspaceId/members/:userId` — Remove member.

### Projects
- `GET /api/projects/workspace/:workspaceId` — List projects in workspace.
- `POST /api/projects/workspace/:workspaceId` — Create project with default board.
- `GET /api/projects/:projectId` — Project overview and stats.
- `PATCH /api/projects/:projectId` — Update project.
- `DELETE /api/projects/:projectId` — Cascade delete project.

### Tasks & Boards
- `GET /api/tasks/project/:projectId` — Filter and list tasks.
- `GET /api/tasks/my` — "My Tasks" with tabs (today, upcoming, overdue, etc.).
- `POST /api/tasks/project/:projectId` — Create task with sequential task number.
- `GET /api/tasks/:taskId` — Retrieve task details.
- `PATCH /api/tasks/:taskId` — Update task fields.
- `PATCH /api/tasks/:taskId/move` — Move task across columns with position ordering.
- `POST /api/tasks/reorder` — Batch update task positions.
- `DELETE /api/tasks/:taskId` — Delete task.
- `POST /api/tasks/:taskId/checklist` — Add checklist item.
- `PATCH /api/tasks/:taskId/checklist/:itemId` — Toggle checklist completion.
- `DELETE /api/tasks/:taskId/checklist/:itemId` — Delete checklist item.
- `POST /api/tasks/:taskId/attachments` — Upload file attachment.
- `DELETE /api/tasks/:taskId/attachments/:attachmentId` — Remove attachment.

### Comments & Collaboration
- `GET /api/comments/task/:taskId` — List comments for task.
- `POST /api/comments/task/:taskId` — Create comment.
- `PATCH /api/comments/:commentId` — Edit own comment.
- `DELETE /api/comments/:commentId` — Delete own comment.

### Notifications & Activity
- `GET /api/notifications` — Paginated notifications with unread count.
- `PATCH /api/notifications/:notificationId/read` — Mark notification read.
- `POST /api/notifications/read-all` — Mark all notifications read.
- `GET /api/activity/workspace/:workspaceId` — Workspace activity audit feed.

### Search & Analytics
- `GET /api/search?workspaceId=...&q=...` — Search tasks, projects, and members.
- `GET /api/reports/overview?workspaceId=...` — Real metrics for charts.
- `GET /api/reports/tasks?workspaceId=...` — Workload breakdown per member.
- `GET /api/reports/export?workspaceId=...` — Export filtered tasks as safe CSV.

---

## 10. Role-Based Access Control (RBAC)

| Role | Permissions |
|---|---|
| **Owner** | Full workspace administration, member management, transfer ownership, delete workspace. |
| **Admin** | Manage workspace settings, invite members, update roles, create/delete projects. |
| **Project Manager** | Create and manage projects, create and assign tasks. |
| **Member** | View accessible projects, create and update tasks, add comments and attachments. |
| **Viewer** | Read-only access to authorized workspace resources. |

---

## 11. Security Implementation

1. **Authentication**: Argon2/bcrypt password hashing with salt rounds. Tokens verified on every request.
2. **Workspace Isolation**: Database queries strictly filter by `workspaceId`. Cross-workspace ID probing is blocked with `403 Forbidden`.
3. **NoSQL Injection Defense**: All MongoDB queries use type-checked and validated parameters; arbitrary query operators (`$where`, `$gt` in object keys) from request bodies are sanitized.
4. **CSV Formula Injection Defense**: Cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` are prepended with `'` and escaped to prevent spreadsheet execution.
5. **File Upload Security**: Multer storage enforces extension and MIME-type allowlists, unique randomized filenames, and a 10MB file limit. Disallowed executable formats (`.exe`, `.bat`, `.sh`, `.php`, etc.) are rejected immediately.
6. **Rate Limiting**: Express rate limiters protect authentication routes against brute-force attacks (30 attempts / 15 minutes).
7. **Security Headers**: Helmet configured with HTTP Strict Transport Security, DNS prefetch control, and clickjacking protection.

---

## 12. Troubleshooting & FAQ

- **Database connection error**: Ensure MongoDB is running locally (`mongod` process) or configure `MONGODB_URI` in `server/.env` with your MongoDB Atlas connection string.
- **Port 5000 in use**: You can customize `PORT=5001` in `server/.env` and adjust `VITE_API_URL=http://localhost:5001/api` and `VITE_SOCKET_URL=http://localhost:5001` in `client/.env`.
- **CORS error**: Verify that `CLIENT_URL` in `server/.env` matches your Vite development server port (default `http://localhost:5173`).
