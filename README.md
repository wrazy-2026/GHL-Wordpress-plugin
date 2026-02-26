# GHL Exporter (Frontend + Local Server)

This project is a local development scaffold for the GHL Exporter app.

Overview:
- Frontend: Vite + React + Tailwind UI (in `frontend/`).
- Server: Express app (in `server/`) that forwards export requests to a configured webhook and receives webhook responses at `/webhook/receive`.

Quick start:

1. Install dependencies for both workspaces:

```bash
npm run install:all
```

2. Start both frontend and server (development):

```bash
npm run dev
```

3. Open the frontend at `http://localhost:5173` (Vite default) and configure your GHL API key, Subaccount ID, and Export Webhook URL in the Integration tab.

Notes on webhook flow:
- The frontend sends an export request to the local server (`/api/export`) which forwards the payload to the configured `Export Webhook URL`.
- Your webhook endpoint (the system that actually creates the WordPress post) should, after processing, POST a JSON payload containing `{ id, wordpressLink }` to `http://<your-machine>:4000/webhook/receive` so the local server stores the result.
- The frontend polls `/api/responses?id=<id>` to receive the WordPress link and populate the table.

If you want the server accessible from the internet for webhook callbacks, use a tunneling tool such as `ngrok` and set the external webhook target accordingly.


Deploying to Google Cloud (Cloud Run)

This project is set up to be deployed as a single container serving both frontend and server.

1. Build and push the container with Cloud Build:

```bash
gcloud builds submit --config cloudbuild.yaml --substitutions=_IMAGE_NAME=ghl-exporter
```

2. Deploy to Cloud Run (replace PROJECT and REGION as needed):

```bash
gcloud run deploy ghl-exporter --image gcr.io/$GOOGLE_CLOUD_PROJECT/ghl-exporter --region us-central1 --platform managed --allow-unauthenticated --port 8080
```

3. After deployment, the Cloud Run service URL will serve the frontend and the server endpoints (`/api/*`, `/webhook/receive`). Use that URL as your webhook callback target.

Notes:
- Ensure `gcloud` is authenticated and the project is selected: `gcloud auth login && gcloud config set project YOUR_PROJECT_ID`.
- If you prefer separate services (frontend in Firebase Hosting, server in Cloud Run), let me know and I can create that configuration.
