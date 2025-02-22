const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class TextExtractionService {
  constructor() {
    this.baseUrl = process.env.TEXT_EXTRACTION_URL || 'http://localhost:3005';
    this.apiVersion = 'v1';
  }

  async extractText(filePath, options = {}) {
    try {
      const formData = new FormData();
      const fileContent = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      
      formData.append('file', new Blob([fileContent]), fileName);
      
      if (options.ocrStrategy) {
        formData.append('ocr_strategy', options.ocrStrategy);
      }
      
      if (options.useCache !== undefined) {
        formData.append('use_cache', options.useCache);
      }

      const response = await axios.post(
        `${this.baseUrl}/api/${this.apiVersion}/extract`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const { task_id } = response.data;
      return this.waitForResult(task_id);
    } catch (error) {
      console.error('Error in text extraction:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  async waitForResult(taskId, maxAttempts = 30, delayMs = 1000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(
          `${this.baseUrl}/api/${this.apiVersion}/status/${taskId}`
        );

        if (response.data.status === 'completed') {
          return response.data.result;
        }

        if (response.data.status === 'failed') {
          throw new Error(response.data.error || 'Text extraction failed');
        }

        await new Promise(resolve => setTimeout(resolve, delayMs));
      } catch (error) {
        console.error('Error checking extraction status:', error);
        throw new Error(`Failed to get extraction status: ${error.message}`);
      }
    }

    throw new Error('Text extraction timed out');
  }

  async clearCache() {
    try {
      await axios.post(`${this.baseUrl}/api/${this.apiVersion}/clear-cache`);
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw new Error(`Failed to clear cache: ${error.message}`);
    }
  }
}

module.exports = new TextExtractionService();
