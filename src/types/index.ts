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

// === Linkbuilding Types ===
export type UserRole = 'admin' | 'employee';
export type LBProjectStatus = 'active' | 'paused' | 'completed';
export type LBLinkType = 'dofollow' | 'nofollow' | 'ugc' | 'sponsored';
export type LBBacklinkCategory = 'PR' | 'Gastbeitrag' | 'Verzeichnis' | 'Forum' | 'Blog' | 'Social' | 'News' | 'Andere';
export type LBMentionStatus = 'new' | 'contacted' | 'converted' | 'ignored';
export type LBBrokenLinkStatus = 'found' | 'contacted' | 'replaced' | 'ignored';
export type LBOutreachStatus = 'new' | 'contacted' | 'replied' | 'converted' | 'rejected';

// Linkbuilding status labels and colors (German)
export const LB_STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
  new: 'Neu',
  contacted: 'Kontaktiert',
  converted: 'Konvertiert',
  ignored: 'Ignoriert',
  found: 'Gefunden',
  replaced: 'Ersetzt',
  replied: 'Geantwortet',
  rejected: 'Abgelehnt',
};

export const LB_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-purple-100 text-purple-800',
  converted: 'bg-green-100 text-green-800',
  ignored: 'bg-gray-100 text-gray-800',
  found: 'bg-orange-100 text-orange-800',
  replaced: 'bg-green-100 text-green-800',
  replied: 'bg-indigo-100 text-indigo-800',
  rejected: 'bg-red-100 text-red-800',
};

export const LB_CATEGORY_LABELS: Record<string, string> = {
  PR: 'PR / Pressemitteilung',
  Gastbeitrag: 'Gastbeitrag',
  Verzeichnis: 'Verzeichnis',
  Forum: 'Forum / Community',
  Blog: 'Blog / Kommentar',
  Social: 'Social Media',
  News: 'News / Presse',
  Andere: 'Andere',
};
