import path from 'path';
import textExtraction from '../utils/textExtraction.js';

describe('Text Extraction Service', () => {
  // Test file paths
  const testPdfPath = path.join(__dirname, 'fixtures', 'MtSaratoga2022Budget.pdf');

  describe('extractText', () => {
    it('should successfully extract text from a PDF file', async () => {
      const result = await textExtraction.extractText(testPdfPath);
      expect(result).toBeInstanceOf(Object);
      expect(typeof result.content).toBe('string');
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('should handle OCR strategy options', async () => {
      const result = await textExtraction.extractText(testPdfPath, {
        ocrStrategy: 'easyocr'
      });
      expect(result).toBeInstanceOf(Object);
      expect(typeof result.content).toBe('string');
    });

    it('should handle caching options', async () => {
      // First extraction (should cache)
      await textExtraction.extractText(testPdfPath, {
        useCache: true
      });

      // Second extraction (should use cache)
      const startTime = Date.now();
      const result = await textExtraction.extractText(testPdfPath, {
        useCache: true
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Cached response should be fast
      expect(result).toBeInstanceOf(Object);
      expect(typeof result.content).toBe('string');
    });
  });

  describe('clearCache', () => {
    it('should successfully clear the cache', async () => {
      await textExtraction.clearCache();
      // No error means success
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent files', async () => {
      try {
        await textExtraction.extractText('non-existent.pdf');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Failed to extract text');
      }
    });

    it('should handle invalid file types', async () => {
      const invalidFilePath = path.join(__dirname, 'fixtures', 'test.txt');
      try {
        await textExtraction.extractText(invalidFilePath);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Failed to extract text');
      }
    });
  });
});
