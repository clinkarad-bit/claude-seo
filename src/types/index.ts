// ========== Auth Types ==========

export type UserRole = "admin" | "employee" | "viewer";

export interface AppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  position: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ========== Customer Types ==========

export type CustomerStatus = "active" | "inactive";

export interface Customer {
  id: string;
  companyName: string;
  description: string;
  domain: string | null;
  logoUrl: string | null;
  projectStart: Date;
  guidelinesPdf: string | null;
  exampleTextPdf: string | null;
  guidelinesText: string | null;
  exampleText: string | null;
  // SEO Metrics
  organicTraffic: number | null;
  totalBacklinks: number | null;
  domainRating: number | null;
  domainAuthority: number | null;
  referringDomains: number | null;
  indexedPages: number | null;
  sitemapUrl: string | null;
  metricsUpdatedAt: Date | null;
  // Style config
  writingStyle: WritingStyle | null;
  imageStyle: ImageStyle | null;
  articleRequirements: string | null;
  // CMS
  wpConnected: boolean;
  webflowConnected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WritingStyle {
  tone: string;
  rules: string[];
  examples: string[];
}

export interface ImageStyle {
  style: string;
  colorScheme: string;
  guidelines: string;
}

export interface CustomerUrl {
  id: string;
  customerId: string;
  url: string;
  title: string | null;
  status: string;
  createdAt: Date;
}

// ========== Writer Persona ==========

export interface WriterPersona {
  id: string;
  customerId: string;
  name: string;
  description: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
}

// ========== Agency & Settings ==========

export interface Agency {
  id: string;
  name: string;
  defaultLanguage: string;
  timezone: string;
  logoUrl: string | null;
}

export interface APIConnectionInfo {
  id: string;
  service: string;
  label: string;
  description: string | null;
  isConnected: boolean;
}

// ========== Keyword Map Types ==========

export type KeywordMapStatus = "generating" | "ready" | "error";
export type SearchIntent = "informational" | "navigational" | "commercial" | "transactional";
export type FunnelLevel = "top" | "middle" | "bottom";

export interface KeywordMap {
  id: string;
  customerId: string;
  name: string;
  seedKeywords: string;
  status: KeywordMapStatus;
  totalKeywords: number;
  coveredKeywords: number;
  coverageScore: number;
  createdAt: Date;
  updatedAt: Date;
  hubs?: KeywordHub[];
  customer?: Customer;
}

export interface KeywordHub {
  id: string;
  keywordMapId: string;
  name: string;
  totalVolume: number;
  keywordCount: number;
  coveredCount: number;
  coverageScore: number;
  keywords?: KeywordEntry[];
}

export interface KeywordEntry {
  id: string;
  hubId: string;
  keyword: string;
  searchVolume: number;
  cpc: number;
  searchIntent: SearchIntent;
  funnelLevel: FunnelLevel;
  difficulty: number | null;
  isCovered: boolean;
  coveredUrl: string | null;
  isMainVariant: boolean;
  parentKeywordId: string | null;
  articleId: string | null;
}

// ========== Article Types ==========

export type ArticleStatus =
  | "outline"
  | "outline_approved"
  | "writing"
  | "draft"
  | "review"
  | "approved"
  | "published"
  | "refresh";

export interface Article {
  id: string;
  customerId: string;
  keyword: string;
  keywordEntryId: string | null;
  status: ArticleStatus;
  title: string | null;
  metaDescription: string | null;
  permalink: string | null;
  outlineContent: OutlineData | null;
  outlineFeedback: ChatMessage[] | null;
  content: string | null;
  contentFeedback: ChatMessage[] | null;
  comments: ArticleComment[] | null;
  serpAnalysis: SERPResult[] | null;
  paaQuestions: string[] | null;
  wdfIdfData: WDFIDFTerm[] | null;
  searchIntent: string | null;
  funnelLevel: string | null;
  images: ArticleImage[] | null;
  featuredImage: string | null;
  personaId: string | null;
  publishedUrl: string | null;
  publishedAt: Date | null;
  wordCount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutlineData {
  suggestedTitle: string;
  sections: OutlineSection[];
}

export interface OutlineSection {
  h2: string;
  bullets: string[];
  keywords: string[];
  internalLinks?: Array<{ url: string; anchor: string }>;
  externalLinks?: Array<{ url: string; anchor: string }>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ArticleComment {
  id: string;
  selection: string;
  comment: string;
  resolved: boolean;
  timestamp: number;
}

export interface SERPResult {
  position: number;
  title: string;
  url: string;
  description: string;
  wordCount: number;
}

export interface WDFIDFTerm {
  term: string;
  score: number;
  frequency: number;
}

export interface ArticleImage {
  url: string;
  alt: string;
  position: string;
}

// ========== Rank Tracker Types ==========

export type RankTrend = "up" | "down" | "stable" | "new";

export interface RankTrackerEntry {
  id: string;
  customerId: string;
  keyword: string;
  url: string | null;
  currentPosition: number | null;
  previousPosition: number | null;
  bestPosition: number | null;
  worstPosition: number | null;
  trend: RankTrend | null;
  trendDays: number | null;
  articleId: string | null;
  history?: RankHistoryEntry[];
}

export interface RankHistoryEntry {
  id: string;
  position: number | null;
  clicks: number;
  impressions: number;
  ctr: number;
  measuredAt: Date;
}

// ========== SEO Tasks ==========

export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "open" | "in_progress" | "done" | "dismissed";

export interface SEOTask {
  id: string;
  articleId: string | null;
  customerId: string | null;
  type: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  analysis: string | null;
  createdAt: Date;
  updatedAt: Date;
  article?: Article;
}

// ========== Content Gap Types ==========

export type GapOpportunity = "high" | "medium" | "low";
export type GapStatus = "open" | "planned" | "created" | "dismissed";

export interface ContentGapEntry {
  id: string;
  customerId: string;
  keyword: string;
  searchVolume: number;
  difficulty: number | null;
  competitorUrl: string | null;
  competitorDomain: string | null;
  opportunity: GapOpportunity | null;
  status: GapStatus;
  articleId: string | null;
  lastChecked: Date;
}

// ========== Competitor Types ==========

export interface CompetitorInfo {
  id: string;
  customerId: string;
  domain: string;
  domainRating: number | null;
  totalBacklinks: number | null;
  organicTraffic: number | null;
  isAISuggested: boolean;
  isManuallyAdded: boolean;
  isActive: boolean;
  lastScreenedAt: Date | null;
  updates?: CompetitorUpdateInfo[];
  backlinks?: CompetitorBacklinkInfo[];
  topPages?: CompetitorTopPageInfo[];
  brokenLinks?: CompetitorBrokenLinkInfo[];
}

export interface CompetitorUpdateInfo {
  id: string;
  month: string;
  summary: string;
  newContent: Array<{ url: string; title: string }> | null;
  backlinksGained: number | null;
  backlinksLost: number | null;
  trafficChange: number | null;
  createdAt: Date;
}

export interface CompetitorBacklinkInfo {
  id: string;
  sourceUrl: string;
  sourceDomain: string;
  anchorText: string | null;
  linkType: string;
  domainRating: number | null;
  isNew: boolean;
  isLost: boolean;
  firstSeen: Date;
}

export interface CompetitorTopPageInfo {
  id: string;
  url: string;
  title: string | null;
  estimatedTraffic: number | null;
  keywords: string[] | null;
  backlinks: number | null;
}

export interface CompetitorBrokenLinkInfo {
  id: string;
  brokenUrl: string;
  sourceUrl: string | null;
  anchorText: string | null;
  topicRelevant: boolean;
  httpStatus: number | null;
}

// ========== Report Types ==========

export type ReportType = "weekly_rank" | "monthly_competitor" | "content_gap" | "custom";

export interface ReportInfo {
  id: string;
  customerId: string;
  type: ReportType;
  title: string;
  data: Record<string, unknown>;
  emailSent: boolean;
  sentAt: Date | null;
  createdAt: Date;
}

export interface ReportConfigInfo {
  id: string;
  customerId: string | null;
  reportType: string;
  recipientEmails: string[];
  isActive: boolean;
  dayOfWeek: number;
  hourOfDay: number;
}

// ========== API Response ==========

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// ========== Legacy Types (backwards compat) ==========

export type TopicClusterStatus = "in_progress" | "done";
export type TopicCategory = "conversion" | "produktnah" | "enger" | "ferner";
export type OutlineStatus = "new" | "revised";
export type ContentStatus = "draft" | "approved" | "published" | "refresh";

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

// Linkbuilding status maps
export type LBProjectStatus = "active" | "paused" | "completed";
export type LBLinkType = "dofollow" | "nofollow" | "ugc" | "sponsored";
export type LBBacklinkCategory = "PR" | "Gastbeitrag" | "Verzeichnis" | "Forum" | "Blog" | "Social" | "News" | "Andere";
export type LBMentionStatus = "new" | "contacted" | "converted" | "ignored";
export type LBBrokenLinkStatus = "found" | "contacted" | "replaced" | "ignored";
export type LBOutreachStatus = "new" | "contacted" | "replied" | "converted" | "rejected";

export const LB_STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  paused: "Pausiert",
  completed: "Abgeschlossen",
  new: "Neu",
  contacted: "Kontaktiert",
  converted: "Konvertiert",
  ignored: "Ignoriert",
  found: "Gefunden",
  replaced: "Ersetzt",
  replied: "Geantwortet",
  rejected: "Abgelehnt",
};

export const LB_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  contacted: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  converted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ignored: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  found: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  replaced: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  replied: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export const LB_CATEGORY_LABELS: Record<string, string> = {
  PR: "PR / Pressemitteilung",
  Gastbeitrag: "Gastbeitrag",
  Verzeichnis: "Verzeichnis",
  Forum: "Forum / Community",
  Blog: "Blog / Kommentar",
  Social: "Social Media",
  News: "News / Presse",
  Andere: "Andere",
};

// Article status labels and colors
export const ARTICLE_STATUS_LABELS: Record<string, string> = {
  outline: "Outline",
  outline_approved: "Outline OK",
  writing: "Wird geschrieben",
  draft: "Entwurf",
  review: "Review",
  approved: "Freigegeben",
  published: "Veröffentlicht",
  refresh: "Aktualisierung",
};

export const ARTICLE_STATUS_COLORS: Record<string, string> = {
  outline: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  outline_approved: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  writing: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  draft: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  review: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  approved: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  published: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  refresh: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export const FUNNEL_LABELS: Record<string, string> = {
  top: "Top of Funnel",
  middle: "Middle of Funnel",
  bottom: "Bottom of Funnel",
};

export const FUNNEL_COLORS: Record<string, string> = {
  top: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  middle: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  bottom: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export const INTENT_LABELS: Record<string, string> = {
  informational: "Informational",
  navigational: "Navigational",
  commercial: "Commercial",
  transactional: "Transactional",
};

export const INTENT_COLORS: Record<string, string> = {
  informational: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  navigational: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  commercial: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  transactional: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};
