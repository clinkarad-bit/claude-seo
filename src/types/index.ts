export type CustomerStatus = "active" | "inactive";

export interface Customer {
  id: string;
  companyName: string;
  description: string;
  domain: string | null;
  logoUrl: string | null;
  guidelinesPdf: string | null;
  exampleTextPdf: string | null;
  guidelinesText: string | null;
  exampleText: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TopicClusterStatus = "in_progress" | "done";

export interface TopicCluster {
  id: string;
  customerId: string;
  name: string;
  status: TopicClusterStatus;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  topics?: Topic[];
  _count?: { topics: number };
}

export type TopicCategory = "conversion" | "produktnah" | "enger" | "ferner";

export interface Topic {
  id: string;
  topicClusterId: string;
  title: string;
  category: TopicCategory;
  searchVolumeTotal: number;
  keywordCount: number;
  avgCpc: number;
  lastUpdated: Date;
  createdAt: Date;
  topicCluster?: TopicCluster;
  keywords?: Keyword[];
  outline?: Outline | null;
}

export interface Keyword {
  id: string;
  topicId: string;
  keyword: string;
  searchVolume: number;
  cpc: number;
  relevant: boolean;
  brandKeyword: boolean;
  localIntent: boolean;
  createdAt: Date;
}

export type OutlineStatus = "new" | "revised";

export interface OutlineSection {
  h2: string;
  bullets: string[];
  keywords: string[];
  internalLinks: Array<{ url: string; anchor: string }>;
  externalLinks: Array<{ url: string; anchor: string }>;
}

export interface Outline {
  id: string;
  topicId: string;
  status: OutlineStatus;
  mainKeyword: string;
  secondaryKeywords: string[];
  internalLinks: Array<{ url: string; anchor: string }>;
  externalLinks: Array<{ url: string; anchor: string }>;
  tfidfData: Array<{ term: string; score: number }> | null;
  content: { suggestedTitle: string; sections: OutlineSection[] };
  feedbackHistory: Array<{ feedback: string; timestamp: number }> | null;
  createdAt: Date;
  updatedAt: Date;
  topic?: Topic;
  contentPiece?: ContentPiece | null;
}

export type ContentStatus =
  | "draft"
  | "approved"
  | "published"
  | "refresh";

export interface ContentPiece {
  id: string;
  outlineId: string;
  status: ContentStatus;
  title: string;
  introduction: string | null;
  content: string | null;
  metaDescription: string | null;
  urlSlug: string | null;
  urlLive: string | null;
  feedbackHistory: Array<{ feedback: string; timestamp: number }> | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  outline?: Outline;
}

export interface PerformanceTracking {
  id: string;
  contentPieceId: string;
  keywordId: string;
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
  measuredAt: Date;
  keyword?: Keyword;
}

export interface PerformanceHistory {
  id: string;
  contentPieceId: string;
  performanceScore: number;
  measuredAt: Date;
}

export interface ContentPieceWithPerformance extends ContentPiece {
  performanceScore?: number;
  latestTracking?: PerformanceTracking[];
  performanceHistory?: PerformanceHistory[];
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface CreateCustomerForm {
  companyName: string;
  description: string;
  domain?: string;
}

export interface CreateTopicClusterForm {
  customerId: string;
  name: string;
  keywordList: string;
  exampleConversion: string;
  exampleProduktnah: string;
  exampleEnger: string;
  exampleFerner: string;
}
