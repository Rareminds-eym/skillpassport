# Backend Deployment Guide

This guide explains how to deploy the Skill Passport backend to production.

## Prerequisites

- Node.js backend with Express server
- Cloudflare R2 credentials
- Backend code in `/Backend` directory

## Deployment Options

### Option 1: Render.com (Recommended - Free Tier Available)

1. **Create a Render account**: Go to [render.com](https://render.com) and sign up

2. **Create a new Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: `skillpassport-backend`
     - **Root Directory**: `Backend`
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
     - **Plan**: Free

3. **Add Environment Variables**:
   Go to Environment tab and add:
   ```
   R2_ACCOUNT_ID=<your-r2-account-id>
   R2_ACCESS_KEY_ID=<your-r2-access-key-id>
   R2_SECRET_ACCESS_KEY=<your-r2-secret-access-key>
   R2_BUCKET_NAME=<your-r2-bucket-name>
   ```

4. **Deploy**: Click "Create Web Service"

5. **Get your backend URL**: After deployment, you'll get a URL like:
   `https://skillpassport-backend.onrender.com`

### Option 2: Railway.app (Alternative)

1. **Create a Railway account**: Go to [railway.app](https://railway.app)

2. **Deploy from GitHub**:
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Node.js

3. **Configure**:
   - Set Root Directory: `Backend`
   - Add environment variables (same as above)

4. **Deploy**: Railway will automatically deploy

### Option 3: Vercel (Serverless)

**Note**: Vercel requires a slightly different setup for serverless functions.

1. Create `vercel.json` in Backend directory (already provided if needed)
2. Deploy via Vercel CLI or GitHub integration

## After Deployment

1. **Copy your production backend URL** (e.g., `https://skillpassport-backend.onrender.com`)

2. **Update Netlify Environment Variables**:
   - Go to your Netlify dashboard
   - Site Settings → Environment Variables
   - Add: `VITE_API_URL=https://skillpassport-backend.onrender.com`

3. **Test the connection**:
   - Visit: `https://your-backend-url.onrender.com/health`
   - Should return: `{"status": "ok"}`

## Troubleshooting

### CORS Errors
- Ensure `https://rareminds-skillpassport.netlify.app` is in the `allowedOrigins` array in `server.js`

### R2 Connection Issues
- Verify all R2 environment variables are set correctly
- Check R2 credentials are valid
- Ensure bucket name is correct

### Deployment Failures
- Check build logs in your deployment platform
- Verify `package.json` has all dependencies
- Ensure Node.js version compatibility

## Local Testing

Before deploying, test locally:
```bash
cd Backend
npm install
node server.js
```

Server should start on `http://localhost:3001`
