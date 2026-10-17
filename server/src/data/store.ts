import fs from 'fs';
import path from 'path';
import { Report, HazardCategory, SeverityLevel, ResolutionStatus, VerificationStatus, User } from '../types';
import { seedReports } from './seedData';

const DATA_FILE = path.join(__dirname, 'reports.json');

// In-memory demo users for fast login/testing
export const demoUsers: User[] = [
  {
    id: 'usr-citizen-1',
    name: 'Aarav Patel (Citizen)',
    email: 'citizen@roadpatrol.ai',
    password: 'password123',
    role: 'citizen',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-authority-1',
    name: 'Inspector Vikram Singh (Traffic Authority)',
    email: 'authority@roadpatrol.ai',
    password: 'password123',
    role: 'authority',
    department: 'Smart City Road Safety Taskforce',
    badgeNumber: 'KA-TRAF-902',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-admin-1',
    name: 'Dr. Neha Sen (System Admin)',
    email: 'admin@roadpatrol.ai',
    password: 'password123',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
];

class ReportStore {
  private reports: Map<string, Report> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const list: Report[] = JSON.parse(raw);
        list.forEach((r) => this.reports.set(r.id, r));
        console.log(`📦 Loaded ${this.reports.size} reports from persistent store.`);
      } else {
        seedReports.forEach((r) => this.reports.set(r.id, r));
        this.persist();
        console.log(`🌱 Initialized with ${this.reports.size} seed hazard reports.`);
      }
    } catch (e) {
      console.warn('⚠️ Could not load reports.json, falling back to seed reports', e);
      seedReports.forEach((r) => this.reports.set(r.id, r));
    }
  }

  private persist() {
    try {
      const arr = Array.from(this.reports.values());
      fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write to reports.json:', e);
    }
  }

  public getAll(filters?: {
    category?: HazardCategory | string;
    severity?: SeverityLevel | string;
    resolutionStatus?: ResolutionStatus | string;
    verificationStatus?: VerificationStatus | string;
    search?: string;
    city?: string;
    bounds?: { north: number; south: number; east: number; west: number };
  }): Report[] {
    let result = Array.from(this.reports.values());

    if (!filters) return result;

    if (filters.category && filters.category !== 'all') {
      result = result.filter((r) => r.category === filters.category);
    }

    if (filters.severity && filters.severity !== 'all') {
      result = result.filter((r) => r.estimatedSeverity === filters.severity);
    }

    if (filters.resolutionStatus && filters.resolutionStatus !== 'all') {
      result = result.filter((r) => r.resolutionStatus === filters.resolutionStatus);
    }

    if (filters.verificationStatus && filters.verificationStatus !== 'all') {
      result = result.filter((r) => r.verificationStatus === filters.verificationStatus);
    }

    if (filters.city) {
      result = result.filter((r) => r.city.toLowerCase().includes(filters.city!.toLowerCase()));
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q) ||
          r.reportNumber.toLowerCase().includes(q)
      );
    }

    if (filters.bounds) {
      const { north, south, east, west } = filters.bounds;
      result = result.filter((r) => {
        const [lng, lat] = r.location.coordinates;
        return lat <= north && lat >= south && lng <= east && lng >= west;
      });
    }

    // Sort by priorityScore descending, then by newest
    return result.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public getById(id: string): Report | undefined {
    return this.reports.get(id);
  }

  public create(reportData: Partial<Report>): Report {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newReport: Report = {
      id: `rp-${Date.now()}-${randomSuffix}`,
      reportNumber: `RP-${new Date().getFullYear()}-${randomSuffix}`,
      reporterName: reportData.reporterName || 'Citizen User',
      reporterEmail: reportData.reporterEmail || '',
      isAnonymous: reportData.isAnonymous ?? false,
      category: reportData.category || 'pothole',
      title: reportData.title || `${reportData.category || 'Road'} Hazard`,
      description: reportData.description || 'Reported road issue needing inspection.',
      originalImageUrl: reportData.originalImageUrl || '',
      annotatedImageUrl: reportData.annotatedImageUrl,
      location: reportData.location || { type: 'Point', coordinates: [77.5946, 12.9716] },
      address: reportData.address || 'Bengaluru Road Network',
      wardOrZone: reportData.wardOrZone || 'Central Zone',
      city: reportData.city || 'Bengaluru',
      verificationStatus: reportData.verificationStatus || 'awaiting_verification',
      estimatedSeverity: reportData.estimatedSeverity || 'medium',
      priorityScore: reportData.priorityScore || 65,
      resolutionStatus: 'submitted',
      assignedDepartment: reportData.assignedDepartment,
      assignedOfficer: reportData.assignedOfficer,
      votes: 1,
      votedIps: [],
      detection: reportData.detection,
      auditLogs: [
        {
          action: 'Report Submitted',
          performedBy: reportData.isAnonymous ? 'Anonymous' : (reportData.reporterName || 'Citizen'),
          role: 'citizen',
          timestamp: new Date().toISOString(),
          details: 'Report filed with AI initial inspection.'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.reports.set(newReport.id, newReport);
    this.persist();
    return newReport;
  }

  public update(id: string, updates: Partial<Report>, performedBy = 'Authority', role = 'authority'): Report | null {
    const existing = this.reports.get(id);
    if (!existing) return null;

    const auditEntry = {
      action: updates.resolutionStatus ? `Status changed to ${updates.resolutionStatus}` : 'Report details updated',
      performedBy,
      role,
      timestamp: new Date().toISOString(),
      details: updates.resolutionNotes || (updates.assignedDepartment ? `Assigned to ${updates.assignedDepartment}` : undefined)
    };

    const updated: Report = {
      ...existing,
      ...updates,
      auditLogs: [...existing.auditLogs, auditEntry],
      updatedAt: new Date().toISOString(),
    };

    this.reports.set(id, updated);
    this.persist();
    return updated;
  }

  public delete(id: string): boolean {
    const existed = this.reports.delete(id);
    if (existed) this.persist();
    return existed;
  }

  public vote(id: string, ip: string): { success: boolean; votes: number; message: string } {
    const report = this.reports.get(id);
    if (!report) return { success: false, votes: 0, message: 'Report not found' };

    if (!report.votedIps) report.votedIps = [];

    if (report.votedIps.includes(ip)) {
      // Toggle vote off
      report.votedIps = report.votedIps.filter((i) => i !== ip);
      report.votes = Math.max(0, report.votes - 1);
      this.persist();
      return { success: true, votes: report.votes, message: 'Vote removed' };
    }

    report.votedIps.push(ip);
    report.votes += 1;
    // Boost priority score slightly with community verification
    if (report.votes >= 10 && report.verificationStatus === 'awaiting_verification') {
      report.verificationStatus = 'verified';
    }
    report.priorityScore = Math.min(100, report.priorityScore + 1);

    this.persist();
    return { success: true, votes: report.votes, message: 'Upvoted and verified' };
  }

  public getStats() {
    const all = Array.from(this.reports.values());

    const totalReports = all.length;
    const pendingVerification = all.filter((r) => r.verificationStatus === 'awaiting_verification' || r.verificationStatus === 'pending').length;
    const verified = all.filter((r) => r.verificationStatus === 'verified').length;
    const inProgress = all.filter((r) => r.resolutionStatus === 'in_progress').length;
    const assigned = all.filter((r) => r.resolutionStatus === 'assigned').length;
    const resolved = all.filter((r) => r.resolutionStatus === 'resolved').length;
    const highPriorityOpen = all.filter((r) => (r.estimatedSeverity === 'critical' || r.estimatedSeverity === 'high') && r.resolutionStatus !== 'resolved').length;

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    all.forEach((r) => {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      bySeverity[r.estimatedSeverity] = (bySeverity[r.estimatedSeverity] || 0) + 1;
    });

    return {
      totalReports,
      pendingVerification,
      verified,
      inProgress,
      assigned,
      resolved,
      highPriorityOpen,
      byCategory,
      bySeverity,
      resolutionRate: totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0,
    };
  }
}

export const reportStore = new ReportStore();
