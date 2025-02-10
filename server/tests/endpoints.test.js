const axios = require('axios');

describe('Endpoint Connectivity Tests', () => {
  // ChromaDB Tests
  describe('ChromaDB Connectivity', () => {
    // Use host.docker.internal when running in Docker, localhost when running locally
    const CHROMA_URL = process.env.CHROMA_ENDPOINT || 'http://localhost:8000';

    // Helper function to delete a collection if it exists
    const deleteCollectionIfExists = async (collectionName) => {
      try {
        await axios.delete(`${CHROMA_URL}/api/v1/collections/${collectionName}`);
      } catch (error) {
        // Ignore errors since the collection might not exist
      }
    };

    beforeEach(async () => {
      // Clean up any test collections before each test
      await deleteCollectionIfExists('test_collection');
      await deleteCollectionIfExists('embedding_test');
    });

    test('ChromaDB heartbeat endpoint should respond', async () => {
      try {
        const response = await axios.get(`${CHROMA_URL}/api/v1/heartbeat`);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('nanosecond heartbeat');
      } catch (error) {
        throw new Error(`ChromaDB heartbeat check failed: ${error.message}`);
      }
    });

    test('ChromaDB should be able to create and delete a collection', async () => {
      try {
        // Create a test collection
        const createResponse = await axios.post(`${CHROMA_URL}/api/v1/collections`, {
          name: 'test_collection',
          metadata: { description: 'Test collection for API verification' }
        });
        expect(createResponse.status).toBe(200);
        expect(createResponse.data).toHaveProperty('id');
        expect(createResponse.data).toHaveProperty('name', 'test_collection');

        // Get collection info to verify it exists
        const getResponse = await axios.get(`${CHROMA_URL}/api/v1/collections/test_collection`);
        expect(getResponse.status).toBe(200);
        expect(getResponse.data).toHaveProperty('name', 'test_collection');

        // Delete the test collection
        const deleteResponse = await axios.delete(`${CHROMA_URL}/api/v1/collections/test_collection`);
        expect(deleteResponse.status).toBe(200);

        // Verify collection is deleted
        try {
          await axios.get(`${CHROMA_URL}/api/v1/collections/test_collection`);
          throw new Error('Collection should not exist after deletion');
        } catch (error) {
          expect(error.response.status).toBe(404);
        }
      } catch (error) {
        throw new Error(`ChromaDB collection operations failed: ${error.message}`);
      }
    });

    test('ChromaDB should handle embeddings correctly', async () => {
      try {
        // Create a collection for embedding tests
        const createResponse = await axios.post(`${CHROMA_URL}/api/v1/collections`, {
          name: 'embedding_test',
          metadata: { description: 'Test collection for embeddings' }
        });
        expect(createResponse.status).toBe(200);
        const collectionId = createResponse.data.id;

        // Create a 1536-dimensional embedding (standard size)
        const embedding = Array(1536).fill(0).map((_, i) => i / 1536);

        // Add a test embedding
        const addResponse = await axios.post(`${CHROMA_URL}/api/v1/collections/embedding_test/add`, {
          ids: ['test1'],
          embeddings: [embedding],
          metadatas: [{ source: 'test' }],
          documents: ['This is a test document']
        });
        expect(addResponse.status).toBe(200);

        // Get collection info to verify the embedding was added
        const getResponse = await axios.get(`${CHROMA_URL}/api/v1/collections/embedding_test`);
        expect(getResponse.status).toBe(200);
        expect(getResponse.data.count).toBe(1);

        // Query the embedding
        const queryResponse = await axios.post(`${CHROMA_URL}/api/v1/collections/embedding_test/query`, {
          query_embeddings: [embedding],
          n_results: 1
        });
        expect(queryResponse.status).toBe(200);
        expect(queryResponse.data.ids).toHaveLength(1);
        expect(queryResponse.data.documents[0][0]).toBe('This is a test document');

        // Clean up
        await deleteCollectionIfExists('embedding_test');
      } catch (error) {
        throw new Error(`ChromaDB embedding operations failed: ${error.message}`);
      }
    });
  });

  // AnythingLLM Tests
  describe('AnythingLLM Connectivity', () => {
    const ANYTHING_LLM_URL = 'http://localhost:3001';

    test('AnythingLLM health check endpoint should respond', async () => {
      try {
        const response = await axios.get(`${ANYTHING_LLM_URL}/health`);
        expect(response.status).toBe(200);
      } catch (error) {
        throw new Error(`AnythingLLM health check failed: ${error.message}`);
      }
    });

    test('AnythingLLM should be accessible', async () => {
      try {
        const response = await axios.get(`${ANYTHING_LLM_URL}`);
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/text\/html/);
      } catch (error) {
        throw new Error(`AnythingLLM accessibility check failed: ${error.message}`);
      }
    });
  });
});
