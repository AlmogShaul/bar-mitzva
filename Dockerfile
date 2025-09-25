# Bar Mitzvah Project - Complete Local Docker Setup
# Multi-stage build: React frontend + Flask backend

# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# Stage 2: Python backend with built frontend
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8080

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Copy Python requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python source code
COPY *.py ./

# Copy built React frontend from previous stage with proper structure
COPY --from=frontend-builder /app/client/build /app/static
# Move the nested static files to the root static directory for proper serving
RUN if [ -d "./static/static" ]; then \
    cp -r ./static/static/* ./static/ && \
    rm -rf ./static/static; \
    fi

# Ensure the audio files are included in the build
COPY audio/ ./audio/

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
\
# Start the production server
CMD ["python", "production_server.py"]
