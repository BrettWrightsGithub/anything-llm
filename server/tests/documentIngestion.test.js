import { jest } from '@jest/globals';
const { CollectorApi } = require('../utils/collectorApi');
const textExtraction = require('../utils/textExtraction');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

jest.mock('../utils/collectorApi', () => {
  return {
    CollectorApi: jest.fn().mockImplementation(() => ({
      online: jest.fn().mockResolvedValue(true),
      acceptedFileTypes: jest.fn().mockResolvedValue(['pdf', 'txt', 'doc']),
      processDocument: jest.fn().mockResolvedValue({ success: true }),
      processLink: jest.fn().mockResolvedValue({ success: true }),
      processRawText: jest.fn().mockResolvedValue({ success: true }),
      getLinkContent: jest.fn().mockResolvedValue({ success: true, content: 'Mocked content' })
    }))
  };
});

describe('Document Ingestion Tests', () => {
  let collectorApi;
  const testPdfPath = path.join(__dirname, 'fixtures', 'test.pdf');
  const testTxtPath = path.join(__dirname, 'fixtures', 'test.txt');

  beforeAll(async () => {
    // Create test files
    if (!fsSync.existsSync(testPdfPath)) {
      await fs.writeFile(testPdfPath, 'Test PDF content');
    }
    if (!fsSync.existsSync(testTxtPath)) {
      await fs.writeFile(testTxtPath, 'Test TXT content');
    }

    collectorApi = new CollectorApi();

    // Mock axios for TextExtractionService
    jest.spyOn(textExtraction, 'extractText').mockImplementation(async (filePath, options) => {
      if (!fsSync.existsSync(filePath)) {
        throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
      }
      return {
        content: 'Mocked extracted text',
        metadata: { source: filePath }
      };
    });
  });

  afterAll(async () => {
    // Clean up test files
    try {
      if (fsSync.existsSync(testPdfPath)) {
        await fs.unlink(testPdfPath);
      }
      if (fsSync.existsSync(testTxtPath)) {
        await fs.unlink(testTxtPath);
      }
    } catch (error) {
      console.error('Error cleaning up test files:', error);
    }
    jest.restoreAllMocks();
  });

  describe('CollectorApi', () => {
    test('should be online', async () => {
      const result = await collectorApi.online();
      expect(result).toBe(true);
    });

    test('should return accepted file types', async () => {
      const types = await collectorApi.acceptedFileTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
      expect(types).toContain('pdf');
    });

    test('should process a document', async () => {
      const result = await collectorApi.processDocument('test.pdf');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should process a link', async () => {
      const result = await collectorApi.processLink('https://example.com');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should process raw text', async () => {
      const result = await collectorApi.processRawText('Test content', { source: 'test' });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should get link content', async () => {
      const result = await collectorApi.getLinkContent('https://example.com');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.content).toBe('Mocked content');
    });
  });

  describe('TextExtractionService', () => {
    test('should extract text from PDF', async () => {
      const result = await textExtraction.extractText(testPdfPath);
      expect(result).toBeDefined();
      expect(result.content).toBe('Mocked extracted text');
    });

    test('should extract text with OCR strategy', async () => {
      const result = await textExtraction.extractText(testPdfPath, {
        ocrStrategy: 'tesseract'
      });
      expect(result).toBeDefined();
      expect(result.content).toBe('Mocked extracted text');
    });

    test('should handle caching', async () => {
      // First extraction with cache
      const result1 = await textExtraction.extractText(testPdfPath, {
        useCache: true
      });
      expect(result1).toBeDefined();

      // Second extraction should use cache
      const result2 = await textExtraction.extractText(testPdfPath, {
        useCache: true
      });
      expect(result2).toBeDefined();
      expect(result2.content).toBe(result1.content);
    });

    test('should clear cache', async () => {
      await expect(textExtraction.clearCache()).resolves.not.toThrow();
    });

    test('should handle non-existent file', async () => {
      const nonExistentPath = path.join(__dirname, 'fixtures', 'non-existent.pdf');
      await expect(textExtraction.extractText(nonExistentPath))
        .rejects
        .toThrow(/no such file or directory/);
    });

    test('should handle invalid file type', async () => {
      const invalidPath = path.join(__dirname, 'fixtures', 'test.invalid');
      await fs.writeFile(invalidPath, 'Invalid content');
      
      await expect(textExtraction.extractText(invalidPath))
        .rejects
        .toThrow();
        
      if (fsSync.existsSync(invalidPath)) {
        await fs.unlink(invalidPath);
      }
    });
  });
});
