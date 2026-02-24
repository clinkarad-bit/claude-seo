import {
  cn,
  truncate,
  slugify,
  parseJSON,
  getStatusLabel,
  getStatusColor,
  formatNumber,
} from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("truncate", () => {
  it("truncates long strings", () => {
    const result = truncate("Hello World", 5);
    expect(result).toBe("Hello…");
  });

  it("returns original string if short enough", () => {
    expect(truncate("Hi", 10)).toBe("Hi");
  });
});

describe("slugify", () => {
  it("converts to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("converts umlauts", () => {
    expect(slugify("Über")).toBe("ueber");
  });
});

describe("parseJSON", () => {
  it("parses valid JSON", () => {
    expect(parseJSON('{"a":1}', {})).toEqual({ a: 1 });
  });

  it("returns fallback for invalid JSON", () => {
    expect(parseJSON("invalid", [])).toEqual([]);
  });

  it("returns fallback for null", () => {
    expect(parseJSON(null, "default")).toBe("default");
  });
});

describe("getStatusLabel", () => {
  it("returns German label for known status", () => {
    expect(getStatusLabel("draft")).toBe("Entwurf");
    expect(getStatusLabel("published")).toBe("Veröffentlicht");
    expect(getStatusLabel("in_progress")).toBe("In Arbeit");
  });

  it("returns raw status for unknown values", () => {
    expect(getStatusLabel("unknown_status")).toBe("unknown_status");
  });
});

describe("formatNumber", () => {
  it("formats numbers with German locale", () => {
    // German locale uses period as thousands separator
    const formatted = formatNumber(1000);
    expect(formatted).toMatch(/1[.,]000/);
  });
});
