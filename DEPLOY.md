# Bar Mitzvah Project - GCP Cloud Run Deployment Guide

## 🚀 Deployment Instructions

### Prerequisites
1. **Google Cloud CLI installed and configured**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```


2. **Enable required APIs**:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

### Option 1: Deploy from Local Machine

1. **Build and push to Google Container Registry**:
   ```bash
   # Set your project ID
   export PROJECT_ID=your-gcp-project-id
   
   # Build the Docker image
   docker build -t gcr.io/$PROJECT_ID/bar-mitzvah-app .
   
   # Push to Google Container Registry
   docker push gcr.io/$PROJECT_ID/bar-mitzvah-app
   ```

2. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy bar-mitzvah-service \
     --image gcr.io/$PROJECT_ID/bar-mitzvah-app \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 2Gi \
     --cpu 2 \
     --timeout 3600 \
     --max-instances 10
   ```

### Option 2: Deploy from GitHub (Recommended)

1. **Connect your repository to Cloud Build**:
   ```bash
   gcloud builds submit --tag gcr.io/$PROJECT_ID/bar-mitzvah-app .
   ```

2. **Create a Cloud Build trigger** (optional for CI/CD):
   ```yaml
   # cloudbuild.yaml
   steps:
   - name: 'gcr.io/cloud-builders/docker'
     args: ['build', '-t', 'gcr.io/$PROJECT_ID/bar-mitzvah-app', '.']
   - name: 'gcr.io/cloud-builders/docker'
     args: ['push', 'gcr.io/$PROJECT_ID/bar-mitzvah-app']
   - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
     entrypoint: gcloud
     args:
     - 'run'
     - 'deploy'
     - 'bar-mitzvah-service'
     - '--image'
     - 'gcr.io/$PROJECT_ID/bar-mitzvah-app'
     - '--region'
     - 'us-central1'
     - '--platform'
     - 'managed'
     - '--allow-unauthenticated'
   ```

### Environment Configuration

The Docker container is configured with:
- **Port**: 8080 (Cloud Run standard)
- **Memory**: 2GB (recommended for AI models)
- **CPU**: 2 cores
- **Timeout**: 60 minutes (for AI processing)
- **Environment**: Production mode

### Features Included in Production Build

✅ **Complete Full-Stack Application**:
- React frontend built and served statically
- Flask backend with all API endpoints
- Single container deployment

✅ **AI Models and Dependencies**:
- Whisper speech recognition
- Audio processing with librosa
- Pitch analysis and comparison
- Hebrew phonetics support

✅ **Audio Processing**:
- FFmpeg for audio conversion
- Rabbi's b1.mp3 reference file
- Real-time audio comparison

✅ **Production Optimizations**:
- Multi-stage Docker build
- Lazy loading of AI models
- Non-GUI matplotlib backend
- Static file serving

### Post-Deployment

1. **Get your service URL**:
   ```bash
   gcloud run services describe bar-mitzvah-service --region=us-central1 --format="value(status.url)"
   ```

2. **Test the deployment**:
   ```bash
   curl https://YOUR_SERVICE_URL/health
   ```

3. **Monitor logs**:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bar-mitzvah-service"
   ```

### Expected Resource Usage

- **Cold Start**: ~30-60 seconds (AI models loading)
- **Memory Usage**: ~1.5GB during AI processing
- **Storage**: ~2GB container image
- **Cost**: Pay-per-request, scales to zero when idle

### Troubleshooting

**If deployment fails**:
- Check Docker build locally first
- Verify all files are present (especially b1.mp3)
- Ensure sufficient memory allocation
- Check Cloud Run logs for errors

**If AI processing is slow**:
- Consider using Cloud Run with more CPU/memory
- Models load on first use (lazy loading)
- Subsequent requests will be faster

Your Bar Mitzvah app will be fully functional on Cloud Run with:
- Complete web interface at the root URL
- API endpoints at /api/*
- Automatic scaling based on traffic
- Global accessibility with HTTPS
