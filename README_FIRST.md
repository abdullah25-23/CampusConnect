# CampusConnect v1.2 — Non-destructive upgrade

This ZIP contains `backend/` and `frontend/` folders **based on the CampusConnect starter files previously supplied in this chat**, updated with the user's six approved features. It does **not** contain or modify `CampusConnectApp/` or your Git history.

## Install into the existing project

1. Back up your existing `backend/` and `frontend/` folders, or make a Git commit before changing them.
2. Extract the ZIP.
3. Copy the ZIP's `backend/` and `frontend/` folders **into your existing `CampusConnect_starter` folder**, merging/replacing matching source files. Leave `CampusConnectApp/` untouched.
4. **Keep your existing `backend/.env`** (there is no `.env` in this archive). Do not share it or upload it to GitHub.
5. In the backend terminal: `npm install`, then `npm run check`, then `npm run dev`.
6. In a separate frontend terminal: `npm install`, then `npm run dev`.
7. Log in as your existing `superadmin@campusconnect.local` user and open **Campus management** in the sidebar.
8. Create a department, category, or department admin. In a student account, refresh the New complaint page to see new categories.

## What was added

- **Super Admin:** dynamic department and category management, department admin creation and activation/deactivation; new student form automatically loads current active categories and routes the complaint server-side.
- **Photo upload:** optional real JPG/PNG file, preview, 5 MB limit, persisted in MongoDB Atlas; authenticated photo viewing.
- **Confidential complaint:** student checkbox, identity hidden from department admins **on the backend**; full visibility for student and Super Admin.
- **Smart priority:** deterministic backend keyword-based low/medium/high suggestion, with staff override and audit-history entry.
- **Complaint status timeline:** existing dated history retained and extended with priority changes.
- **Advanced analytics:** live 7-day trend, priorities, average resolution hours, 7-day backlog, complaint hotspots, existing charts.
- **Preservation:** existing users, complaints, login roles, BIIT logo, and deep green/gold visual system remain compatible.

## Quick smoke test

1. `http://localhost:5000/api/health` should report database connected.
2. Super Admin → Campus management → Add a department → Add a category tied to it → Add a department admin.
3. Register/login as student → New complaint → see added category → attach JPG/PNG → check Confidential → submit.
4. Log in as the department admin → complaint is visible and student identity says **Confidential student** → test image and status/priority controls.
5. Log in as Super Admin → view real submitter identity and analytics.
6. Test the frontend from a mobile browser or DevTools at ~375px width.

## Deploy

- **Render API:** Root `backend`, Build `npm install`, Start `npm start`. Your existing Atlas/JWT variables stay the same. Confirm `FRONTEND_URL` is your deployed frontend URL, or a comma-separated list.
- **Vercel React:** Root `frontend`, Build `npm run build`, Output `dist`. Set `VITE_API_URL` to the HTTPS URL of your Render backend.
- Commit and push, then verify both services redeploy. Keep `.env` private.

## Testing note

Static parser checks and a small backend unit test script were run in the build environment. Full `npm install` and end-to-end browser/API tests could not be completed there due to package registry access, so run `npm install`, `npm run check`, and `npm run build` on your machine before deployment.
