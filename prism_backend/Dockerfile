# RoadVanta AI - FastAPI YOLOv8 Production Dockerfile
FROM python:3.10-slim

# Install system dependencies for OpenCV and PyTorch CPU
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency specifications
COPY requirements.txt .

# Install dependencies (CPU PyTorch to keep image lightweight and fast on free tiers)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy application files and model weights
COPY . .

# Set environment defaults
ENV PORT=8000
ENV POTHOLE_MODEL_PATH=./models/best.pt
ENV POTHOLE_CONFIDENCE_THRESHOLD=0.15
ENV PRISM_DATABASE_URL=sqlite:///./prism_road.db
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Run uvicorn on dynamic port
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
