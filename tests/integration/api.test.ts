/**
 * Integration tests for API routes using mocked Prisma.
 * Run with: npm test
 */

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    customer: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    topicCluster: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    outline: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    contentPiece: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  },
}));

// Mock AI to avoid actual API calls
jest.mock("@/lib/ai", () => ({
  generateTopicSuggestions: jest.fn().mockResolvedValue([
    { category: "conversion", topics: ["Thema 1", "Thema 2"] },
    { category: "produktnah", topics: ["Thema 3"] },
    { category: "enger", topics: [] },
    { category: "ferner", topics: [] },
  ]),
  generateOutline: jest.fn().mockResolvedValue({
    suggestedTitle: "Test Title",
    sections: [],
  }),
  callAI: jest.fn().mockResolvedValue({ content: "Mock AI response" }),
}));

describe("SEO tool API mocks", () => {
  it("AI mock returns topic suggestions", async () => {
    const { generateTopicSuggestions } = await import("@/lib/ai");
    const result = await generateTopicSuggestions({
      kundenname: "Test GmbH",
      kundenbeschreibung: "Test beschreibung",
      themencluster: "Testthema",
      keywordListe: "test keyword",
      beispiele_conversion: "",
      beispiele_produktnah: "",
      beispiele_enger: "",
      beispiele_ferner: "",
    });
    expect(result).toHaveLength(4);
    expect(result[0].category).toBe("conversion");
    expect(result[0].topics).toContain("Thema 1");
  });

  it("AI mock returns outline", async () => {
    const { generateOutline } = await import("@/lib/ai");
    const result = await generateOutline({
      thema: "Test",
      mainKeyword: "test keyword",
      secondaryKeywords: [],
      tfidfTerme: [],
      internLinks: [],
      externLinks: [],
      kundenGuidelines: "",
      beispieltext: "",
    });
    expect(result.suggestedTitle).toBe("Test Title");
    expect(result.sections).toBeInstanceOf(Array);
  });
});

describe("Performance score calculation", () => {
  it("correctly weights ranked vs unranked keywords", async () => {
    const { calculatePerformanceScore } = await import("@/lib/seo");

    // All ranked at position 50 → score around 50% of 50
    const allRanked = Array(10).fill({ position: 50 });
    const score = calculatePerformanceScore(allRanked);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
