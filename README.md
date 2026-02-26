# GHL Exporter (Frontend + Local Server)

This project is a advanced development scaffold for the GHL Exporter app, bridging GoHighLevel content with WordPress exports via a secure local bridge.

## ✨ Key Features

- **🌐 GoHighLevel Integration:**
  - Automated fetching of **Funnels, Websites, and Blog Posts** via GHL API.
  - Intelligent URL construction that handles custom domains, GHL preview links, and canonical paths.
  - Multi-version API support (v1 & v2 for Funnels/Websites).
- **🔄 Local Webhook Bridge:**
  - Express server acting as a proxy to forward export requests securely.
  - Dedicated endpoint (`/webhook/receive`) to collect asynchronous responses from external WordPress systems.
  - In-memory state tracking with frontend polling for a seamless export experience.
- **🛠️ Developer-First Scaffold:**
  - Vite-powered React frontend with Tailwind UI.
  - Mono-repo structure with concurrent development scripts.
  - Ready-to-deploy Docker configuration for Google Cloud Run.

## 🚀 Quick Start

### 1. Installation
Install dependencies for both the frontend and server workspaces:
```bash
npm run install:all
```

### 2. Development
Start both the frontend and server concurrently:
```bash
npm run dev
```

### 3. Configuration
- Open the frontend at [http://localhost:5173](http://localhost:5173).
- Head to the **Integration** tab to set your:
  - **GHL API Key**
  - **Subaccount ID**
  - **Export Webhook URL** (The external system that processes the WordPress export).

---

## ☁️ Deployment to Google Cloud (Cloud Run)

This project is optimized to run as a single container serving both the React frontend and the Express bridge.

### Phase 1: Build Image
Build and push the container using Google Cloud Build:
```bash
gcloud builds submit --config cloudbuild.yaml --substitutions=_IMAGE_NAME=ghl-exporter
```

### Phase 2: Deploy to Cloud Run
Deploy the service (update `PROJECT_ID` as needed):
```bash
gcloud run deploy ghl-exporter \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/ghl-exporter \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

> [!NOTE] 
> The Cloud Run service URL will serve both the frontend and the API endpoints (`/api/*`, `/webhook/receive`). Use the final service URL as your webhook callback target in external systems.

## 🤝 Notes on Webhook Flow
1. **Request:** Frontend (via `/api/export`) -> Local Server -> External Webhook (WordPress).
2. **Process:** External Webhook processes the item (creates post).
3. **Response:** External Webhook POSTs `{ id, wordpressLink }` back to `https://<your-deploy-url>/webhook/receive`.
4. **Completion:** Frontend polls `/api/responses?id=<id>` to retrieve and display the live WordPress link.
