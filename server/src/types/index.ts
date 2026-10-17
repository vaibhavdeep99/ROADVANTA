// ==========================================
// Road Patrol AI — Server Types
// ==========================================

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

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

export interface DetectionResult {
  id?: string;
  reportId?: string;
  modelName: string;
  modelVersion: string;
  detectedCategories: HazardCategory[];
  boundingBoxes: BoundingBox[];
  modelConfidence: number;
  estimatedSeverity: SeverityLevel;
  inferenceStatus: 'completed' | 'failed';
  inferenceTimestamp: string;
}

export interface AuditLogEntry {
  action: string;
  performedBy: string;
  role: string;
  timestamp: string;
  details?: string;
}

export interface Report {
  id: string;
  reportNumber: string;
  reporterId?: string;
  reporterName?: string;
  reporterEmail?: string;
  isAnonymous?: boolean;
  category: HazardCategory;
  title: string;
  description: string;
  originalImageUrl: string;
  annotatedImageUrl?: string;
  location: GeoLocation;
  address: string;
  wardOrZone?: string;
  city: string;
  verificationStatus: VerificationStatus;
  estimatedSeverity: SeverityLevel;
  priorityScore: number; // 1 - 100
  resolutionStatus: ResolutionStatus;
  assignedDepartment?: string;
  assignedOfficer?: string;
  votes: number;
  votedIps?: string[];
  detection?: DetectionResult;
  resolutionNotes?: string;
  resolutionImageUrl?: string;
  auditLogs: AuditLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'citizen' | 'authority' | 'admin';
  department?: string;
  badgeNumber?: string;
  createdAt: string;
}
