## 2025-09-29

### Fixed
- Restored collaboration application submissions by routing optional resume uploads through the resume endpoint and sending clean JSON payloads (`frontend/src/pages/ApplyJob/ApplyJob.jsx`).
- Surfaced recent application activity for students on the dashboard with status-aware styling (`frontend/src/pages/Dashboard/Dashboard.jsx`, `frontend/src/pages/Dashboard/Dashboard.module.css`).

### Notes
- Frontend linting still reports longstanding warnings/errors in unrelated components; see `npm run lint` output for details.
