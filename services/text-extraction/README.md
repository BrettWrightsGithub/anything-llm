# Text Extraction Service

This service integrates [text-extract-api](https://github.com/CatchTheTornado/text-extract-api) into anything-llm for enhanced PDF processing capabilities.

## Features

- Local LLM support via Ollama
- Advanced OCR capabilities using EasyOCR
- PII removal
- Conversion to structured JSON or Markdown
- Multiple OCR strategies (llama3.2-vision, easyOCR, minicpm-v)
- Caching of OCR results

## Setup

1. Install dependencies:
   ```bash
   # macOS
   brew update && brew install libmagic poppler pkg-config ghostscript ffmpeg automake autoconf
   ```

2. Configure environment:
   Copy `.env.example` to `.env` and adjust settings as needed.

3. Start the service:
   ```bash
   docker-compose up -d
   ```

## Configuration

The service can be configured through environment variables:

- `OLLAMA_HOST`: URL of your Ollama instance (default: http://localhost:11434)
- `DISABLE_LOCAL_OLLAMA`: Set to 1 to disable local Ollama (requires external Ollama instance)
- `OCR_STRATEGY`: Choose OCR strategy (easyocr, llama3.2-vision, minicpm-v)
- `REDIS_URL`: Redis connection URL for caching
- `STORAGE_STRATEGY`: Choose storage strategy (local, gdrive)

## API Endpoints

- `POST /api/v1/extract`: Extract text from documents
- `GET /api/v1/status/:taskId`: Check extraction status
- `POST /api/v1/clear-cache`: Clear OCR cache

## Integration with anything-llm

This service is used by the main anything-llm server for processing PDF files and other documents. It replaces the previous PDF processing implementation with more advanced features and local LLM support.
