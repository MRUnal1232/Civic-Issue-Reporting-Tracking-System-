# Deployment Guide

How to deploy the Civic Issue Tracker to production using MongoDB Atlas, Render, and Vercel — all free-tier, no credit card required.

## Overview

| Service | Hosts | Platform |
|---|---|---|
| Database | MongoDB | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free M0 cluster) |
| Backend API | Node/Express | [Render](https://render.com) |
| Classifier | Java/Spring Boot | [Render](https://render.com) (Docker) |
| Frontend | React | [Vercel](https://vercel.com) |

Deploy in this order: **Atlas → Render → Vercel**, since each later step needs a URL from the one before it.

## 1. MongoDB Atlas

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free **M0** cluster.
2. Under **Database Access**, create a database user with a username/password.
3. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) — Render's outbound IPs aren't static on the free tier.
4. Click **Connect → Drivers**, copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/civic-issues?retryWrites=true&w=majority`
   Keep this — it's your `MONGODB_URI`.

## 2. Render (backend + classifier)

This repo includes a [render.yaml](render.yaml) Blueprint that defines both services.

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In Render, click **New → Blueprint**, connect your GitHub account, and select this repo. Render reads `render.yaml` and proposes both services (`civic-tracker-backend`, `civic-tracker-classifier`).
3. Before deploying, fill in the backend's secret env vars (marked `sync: false` in the blueprint — Render will prompt for these):
   - `MONGODB_URI` — from step 1
   - `FRONTEND_URL` — leave a placeholder for now (e.g. `http://localhost:3000`); update it after step 3 once you have the real Vercel URL
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — from your Cloudinary dashboard
   - `JWT_SECRET` and `JAVA_CLASSIFIER_URL` are filled in automatically by the blueprint
4. Deploy. Once both services are live, note the backend's public URL (e.g. `https://civic-tracker-backend.onrender.com`) — this is your `REACT_APP_API_URL` (with `/api` appended) for the frontend.

> Free-tier Render web services spin down after 15 minutes of inactivity and take ~30–60s to wake on the next request — expect a slow first load after idling.

## 3. Vercel (frontend)

1. In Vercel, click **Add New → Project**, import this repo, and set the **Root Directory** to `frontend`.
2. Framework preset: Create React App (auto-detected).
3. Add an environment variable:
   - `REACT_APP_API_URL` = `https://civic-tracker-backend.onrender.com/api` (your Render backend URL + `/api`)
4. Deploy. Vercel gives you a URL like `https://your-project.vercel.app`.
5. Go back to Render → `civic-tracker-backend` → Environment, and update `FRONTEND_URL` to that real Vercel URL, so CORS allows requests from it. Redeploy the backend for the change to take effect.

## Verifying the deployment

- Visit the Vercel URL, register an account, and report an issue with a photo — this exercises the frontend, backend, Cloudinary, and MongoDB Atlas in one flow.
- Check that the issue's "AI Suggested Category" appears on the admin view of the issue detail page — this confirms the backend successfully reached the Java classifier service.
- `https://civic-tracker-backend.onrender.com/api/health` should return `{"status":"OK", ...}`.
