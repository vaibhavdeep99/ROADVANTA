// ==========================================
// Road Patrol AI — TypeScript Type Definitions
// ==========================================

// User & Auth
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'citizen' | 'authority' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

// Reports
export type HazardCategory =
  | 'pothole'
  | 'road_crack'
  | 'broken_surface'
  | 'road_debris'
  | 'damaged_signal'
  | 'damaged_barrier'
  | 'waterlogging'
  | 'road_obstruction'
  | 'potential_accident'
  | 'citizen_reported_accident'
  | 'normal_road'
  | 'unrelated'
  | 'other';

export type VerificationStatus =
  | 'pending'
  | 'awaiting_verification'
  | 'verified'
  | 'rejected';

export type ResolutionStatus =
  | 'submitted'
  | 'awaiting_verification'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type SeverityLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Report {
  id: string;
  _id?: string;
  reportNumber: string;
  reporterId?: string | User;
  reporterName?: string;
  reporterEmail?: string;
  isAnonymous?: boolean;
  category: HazardCategory;
  title: string;
  description: string;
  originalImageUrl: string;
  annotatedImageUrl?: string;
  location: GeoJSONPoint;
  address: string;
  wardOrZone?: string;
  city?: string;
  reportedAt?: string;
  verificationStatus: VerificationStatus;
  estimatedSeverity: SeverityLevel;
  priorityScore: number;
  resolutionStatus: ResolutionStatus;
  assignedDepartment?: string;
  assignedOfficer?: string;
  assignedTo?: string;
  duplicateGroupId?: string;
  votes: number;
  detection?: any;
  resolutionNotes?: string;
  resolutionImageUrl?: string;
  auditLogs?: any[];
  createdAt: string;
  updatedAt: string;
}

// Detection Results
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

export interface DetectionResult {
  _id: string;
  reportId: string;
  modelName: string;
  modelVersion: string;
  detectedCategories: string[];
  boundingBoxes: BoundingBox[];
  modelConfidence: number;
  inferenceStatus: 'pending' | 'processing' | 'completed' | 'failed';
  inferenceTimestamp: string;
  reviewStatus: 'pending' | 'confirmed' | 'rejected' | 'corrected';
  reviewedBy?: string;
  reviewedAt?: string;
}

// Notifications
export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedReportId?: string;
  readAt?: string;
  createdAt: string;
}

// Analytics
export interface OverviewStats {
  totalReports: number;
  totalPotholes: number;
  totalAccidents: number;
  totalSignalDamage: number;
  highPriorityOpen: number;
  inProgress: number;
  resolved: number;
  pendingVerification: number;
}

export interface TrendData {
  date: string;
  count: number;
  category?: string;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

// Map types
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapFilter {
  categories?: HazardCategory[];
  severities?: SeverityLevel[];
  verificationStatus?: VerificationStatus[];
  resolutionStatus?: ResolutionStatus[];
  dateFrom?: string;
  dateTo?: string;
  bounds?: MapBounds;
}

// Intelligence / Area Analysis
export interface GeoJSONGeometry {
  type: string;
  coordinates: any;
}

export interface AreaAnalysisRequest {
  geometry: GeoJSONGeometry;
  dateFrom?: string;
  dateTo?: string;
  categories?: HazardCategory[];
  verificationStatus?: VerificationStatus[];
  resolutionStatus?: ResolutionStatus[];
}

export interface AreaStatistics {
  totalReports: number;
  uniqueIncidentGroups: number;
  byCategory: CategoryDistribution[];
  byPriority: CategoryDistribution[];
  bySeverity: CategoryDistribution[];
  byResolutionStatus: CategoryDistribution[];
  highPriorityOpen: number;
  verified: number;
  resolved: number;
  unresolved: number;
  pendingVerification: number;
  trends: TrendData[];
}

export interface AreaAnalysisResult {
  _id: string;
  statistics: AreaStatistics;
  aiSummary?: string;
  recommendations?: string[];
  reportImages: { url: string; category: string; date: string }[];
  generatedAt: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    stack?: string;
  };
}
