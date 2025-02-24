const { CommunityHub } = require("../models/communityHub");
const { expect } = require("chai");
const nock = require("nock");

describe("CommunityHub", () => {
  beforeEach(() => {
    // Clear all nock interceptors
    nock.cleanAll();
  });

  afterEach(() => {
    // Ensure all nock interceptors were used
    expect(nock.isDone()).to.be.true;
  });

  describe("fetchExploreItems", () => {
    it("should fetch explore items from production API when NODE_ENV is production", async () => {
      process.env.NODE_ENV = "production";
      const mockResponse = {
        agentSkills: { items: [], hasMore: false, totalCount: 0 },
        systemPrompts: { items: [], hasMore: false, totalCount: 0 },
        slashCommands: { items: [], hasMore: false, totalCount: 0 }
      };

      nock("https://hub.external.anythingllm.com")
        .get("/v1/explore")
        .reply(200, mockResponse);

      const result = await CommunityHub.fetchExploreItems();
      expect(result).to.deep.equal(mockResponse);
    });

    it("should handle API errors gracefully", async () => {
      process.env.NODE_ENV = "production";
      
      nock("https://hub.external.anythingllm.com")
        .get("/v1/explore")
        .reply(500);

      const result = await CommunityHub.fetchExploreItems();
      expect(result).to.deep.equal({
        agentSkills: { items: [], hasMore: false, totalCount: 0 },
        systemPrompts: { items: [], hasMore: false, totalCount: 0 },
        slashCommands: { items: [], hasMore: false, totalCount: 0 }
      });
    });
  });
});
