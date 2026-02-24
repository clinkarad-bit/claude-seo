import {
  calculatePerformanceScore,
  getScoreColor,
  generateSlug,
  parseTFIDFCsv,
} from "@/lib/seo";

describe("calculatePerformanceScore", () => {
  it("returns 0 for empty rankings", () => {
    expect(calculatePerformanceScore([])).toBe(0);
  });

  it("returns 0 when no keywords rank in top 100", () => {
    const rankings = [{ position: 101 }, { position: 200 }];
    expect(calculatePerformanceScore(rankings)).toBe(0);
  });

  it("returns high score for position 1 rankings", () => {
    const rankings = [{ position: 1 }, { position: 1 }, { position: 1 }];
    const score = calculatePerformanceScore(rankings);
    expect(score).toBeGreaterThan(90);
  });

  it("returns medium score for mixed rankings", () => {
    const rankings = [
      { position: 5 },
      { position: 15 },
      { position: 50 },
      { position: 150 },
    ];
    const score = calculatePerformanceScore(rankings);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });

  it("caps score at 100", () => {
    const rankings = Array(100).fill({ position: 1 });
    const score = calculatePerformanceScore(rankings);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("getScoreColor", () => {
  it("returns green for score >= 60", () => {
    expect(getScoreColor(60)).toBe("green");
    expect(getScoreColor(100)).toBe("green");
  });

  it("returns yellow for score 30-59", () => {
    expect(getScoreColor(30)).toBe("yellow");
    expect(getScoreColor(59)).toBe("yellow");
  });

  it("returns red for score < 30", () => {
    expect(getScoreColor(0)).toBe("red");
    expect(getScoreColor(29)).toBe("red");
  });
});

describe("generateSlug", () => {
  it("converts German umlauts", () => {
    expect(generateSlug("Hund läuft")).toBe("hund-laeuft");
    expect(generateSlug("Öl und Ärger")).toBe("oel-und-aerger");
    expect(generateSlug("Straße")).toBe("strasse");
  });

  it("removes special characters", () => {
    expect(generateSlug("Hello, World!")).toBe("hello-world");
  });

  it("handles multiple spaces/hyphens", () => {
    expect(generateSlug("hund  humpelt")).toBe("hund-humpelt");
  });
});

describe("parseTFIDFCsv", () => {
  it("parses CSV with header", () => {
    const csv = `term,score\nhund,0.95\nlahmheit,0.87`;
    const result = parseTFIDFCsv(csv);
    expect(result).toHaveLength(2);
    expect(result[0].term).toBe("hund");
    expect(result[0].score).toBe(0.95);
  });

  it("sorts by score descending", () => {
    const csv = `term,score\na,0.5\nb,0.9\nc,0.3`;
    const result = parseTFIDFCsv(csv);
    expect(result[0].score).toBe(0.9);
    expect(result[result.length - 1].score).toBe(0.3);
  });

  it("limits to 100 terms", () => {
    const rows = Array.from(
      { length: 150 },
      (_, i) => `term${i},${Math.random()}`
    );
    const csv = ["term,score", ...rows].join("\n");
    const result = parseTFIDFCsv(csv);
    expect(result).toHaveLength(100);
  });

  it("handles missing header", () => {
    const csv = `hund,0.95\nlahmheit,0.87`;
    const result = parseTFIDFCsv(csv);
    expect(result.length).toBeGreaterThan(0);
  });
});
