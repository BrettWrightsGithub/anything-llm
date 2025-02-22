# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libmagic1 \
    poppler-utils \
    ghostscript \
    ffmpeg \
    automake \
    autoconf \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Clone text-extract-api repository
RUN apt-get update && apt-get install -y git \
    && git clone https://github.com/CatchTheTornado/text-extract-api.git . \
    && rm -rf .git

# Install Python dependencies
RUN pip install --no-cache-dir -e .

# Copy configuration files
COPY .env.example .env

# Expose port
EXPOSE 3000

# Start the application
CMD ["./run.sh"]
