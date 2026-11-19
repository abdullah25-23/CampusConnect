# CampusConnect Backend v1.2

A non-destructive update to the competition backend. Preserve your existing `.env` file and MongoDB Atlas database.

## Setup

```powershell
cd backend
npm install
npm run check
npm run dev
```

Do **not** run `npm run seed` after this upgrade unless you specifically want to ensure the demo accounts exist. The existing accounts and complaints are kept unchanged.

The normal startup automatically creates the four **default department and category records** if they are missing. MongoDB collections are created on first write. Existing complaints, users, and seed accounts are preserved.

## APIs

### Public

- `GET /api/health`
- `GET /api/meta/categories` — active categories and their departments
- `GET /api/meta/departments` — active departments

### Authentication

- `POST /api/auth/register` — students only
- `POST /api/auth/login`
- `GET /api/auth/me`

### Complaints (Bearer token required)

- `POST /api/complaints` — student only. `multipart/form-data`: `title`, `description`, `category`, optional `location`, `confidential` (`true`/`false`), optional `image` (JPG/PNG, max 5 MB). Existing JSON requests remain supported.
- `GET /api/complaints` — role-scoped records; optional status/category/priority filters, super-admin-only department filter
- `GET /api/complaints/:id`
- `GET /api/complaints/:id/evidence` — sends protected image bytes. Requires an Authorization header.
- `PATCH /api/complaints/:id/status` — staff; `{ "status": "in_progress", "note": "Reviewing" }`
- `PATCH /api/complaints/:id/priority` — staff; `{ "priority": "high", "note": "Urgent" }`
- `POST /api/complaints/:id/remarks` — staff

### Super Admin only

- `GET/POST /api/admin/departments`
- `PATCH /api/admin/departments/:id` — rename or activate/deactivate
- `GET/POST /api/admin/categories`
- `PATCH /api/admin/categories/:id` — rename, change routing of future complaints, activate/deactivate
- `GET/POST /api/admin/department-admins` — create staff accounts with initial passwords
- `PATCH /api/admin/department-admins/:id` — name, department, active status
- `POST /api/admin/department-admins/:id/reset-password`

### Analytics

- `GET /api/dashboard/stats` — role-scoped status, department/category/priority breakdown, last-7-day trend, average resolution time, 7-day backlog, top complaint locations.

## Security and data

- Department admins can view **only their assigned department**; students can view **only their own complaints**. This is server-side, including uploaded image URLs.
- In confidential complaints, the departmental API omits the student's ID and email and redacts their name from the complaint history. The student and Super Admin retain full access.
- Students should avoid names or faces in complaint text/images if they want confidentiality; there is no automatic image redaction.
- Images are stored as separate binary documents in MongoDB Atlas, **not** in the Render local filesystem. Free-tier storage is limited; consider external object storage and rate limits for a larger rollout.
- Automatic priority classification is a simple, explainable keyword heuristic, not AI or emergency-response triage. Admins can override it.
- Keep `backend/.env` out of Git. Back up Atlas data prior to production migrations.

## Deployment

Your existing Render service works with `Root Directory=backend`, `Build Command=npm install`, `Start Command=npm start`. Keep `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL` configured as before. Redeploy the service after pushing the upgrade. No Cloudinary account or credentials are required.
