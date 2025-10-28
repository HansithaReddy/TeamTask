# Team Task Manager — Premium UI (Frontend only)

This package focuses purely on frontend UI/UX improvements inspired by swayammassey.space.
It keeps the same Firebase backend wiring as before, so no backend changes are required.

Quick start:
1. `npm install`
2. Paste your Firebase config in `src/firebase.js`
3. `npm run dev`

Notes:
- postcss.config.cjs is used to avoid ESM/CommonJS mismatch.
- Dark mode implemented with theme tokens; both light and dark are carefully contrasted.
- Framer Motion used for subtle page and component transitions.

Serverless notification (optional)
---------------------------------

This project includes a scaffold for sending email notifications to assignees when tasks are created or reassigned. It's optional and disabled by default.

1. Example Cloud Function
	- See `functions/sendEmail/index.js` for an example Firebase Cloud Function using SendGrid.

2. Deploy and configure
	- Deploy the function to Firebase (or any serverless host) and enable SendGrid with your API key.
	- Set the function URL as the `NOTIFY_ENDPOINT` environment variable in your frontend build environment. Example (Windows PowerShell):

	  $env:NOTIFY_ENDPOINT = "https://us-central1-your-project.cloudfunctions.net/sendTaskNotification"

	- Alternatively, set `functions.config().sendgrid.key` and deploy the example function in the `functions/` folder.

3. How the frontend uses it
	- The frontend has a `notifyAssignee` helper in `src/services/api.firebase.js` which will POST `{ to, task }` to `NOTIFY_ENDPOINT` if configured.
	- The call is non-blocking: task creation/update will still succeed even if the email fails.

4. Security
	- Keep your SendGrid API key secret (do not commit). Use Firebase functions config or environment variables on your hosting provider.

