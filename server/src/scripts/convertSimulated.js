const fs = require('fs');
const path = require('path');

const srcPath = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/b5a3d0ae-25b1-4a24-8ea4-27bd7dcdcd37/.user_uploaded/media_1792247702739.json';
const raw = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

const imageMap = {
  pothole: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
  road_damage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
  waterlogging: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
  traffic_signal: 'https://images.unsplash.com/photo-1508873696983-2df570364e65?auto=format&fit=crop&w=800&q=80',
  road_obstruction: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
  accident_risk_scenario: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80'
};

const categoryMap = {
  pothole: 'pothole',
  road_damage: 'broken_surface',
  waterlogging: 'waterlogging',
  traffic_signal: 'damaged_signal',
  road_obstruction: 'road_obstruction',
  accident_risk_scenario: 'potential_accident'
};

const severityMap = {
  High: 'high',
  Medium: 'medium',
  Low: 'low'
};

const statusMap = {
  Open: 'submitted',
  'In Progress': 'in_progress',
  Resolved: 'resolved'
};

const officers = ['Kapoor', 'Sharma', 'Verma', 'Yadav', 'Singh', 'Gupta', 'Patel'];

const converted = raw.map((item, idx) => {
  const cat = categoryMap[item.hazardType] || 'broken_surface';
  const sev = severityMap[item.severity] || 'medium';
  const resStatus = statusMap[item.status] || 'submitted';
  const priority = sev === 'high' ? 88 : (sev === 'medium' ? 62 : 38);
  const routePart = item.routeName ? ' (' + item.routeName + ')' : '';

  return {
    id: item.demoId,
    reportNumber: item.demoId,
    reporterName: 'AI RoadPatrol Fleet',
    reporterEmail: 'sensor-fleet@roadvanta.ai',
    isAnonymous: false,
    category: cat,
    title: item.title + (item.routeName ? ' - ' + item.routeName : ' - ' + item.city),
    description: item.description + (item.recommendedPrecautions ? ' Guidance: ' + item.recommendedPrecautions : ''),
    originalImageUrl: item.imageUrl || imageMap[item.hazardType] || imageMap.pothole,
    location: item.location,
    address: item.city + ' Road Sector ' + (idx + 1) + routePart + ', Smart Transit Corridor',
    wardOrZone: item.city + ' Zone ' + ((idx % 12) + 1),
    city: item.city,
    verificationStatus: 'verified',
    estimatedSeverity: sev,
    priorityScore: priority,
    resolutionStatus: resStatus,
    assignedDepartment: item.city + ' Municipal Road Safety Taskforce',
    assignedOfficer: 'Officer ' + officers[idx % officers.length],
    votes: Math.floor(Math.random() * 25) + 3,
    detection: {
      modelName: 'RoadVision-Gemini-2.5',
      modelVersion: '2.5.0',
      detectedCategories: [cat],
      boundingBoxes: [
        { x: 22, y: 30, width: 50, height: 40, label: item.title, confidence: 0.94 }
      ],
      modelConfidence: 0.94,
      estimatedSeverity: sev,
      inferenceStatus: 'completed',
      inferenceTimestamp: item.createdAt || new Date().toISOString()
    },
    auditLogs: [
      { action: 'Report Logged', performedBy: 'Simulated Hackathon Data Pipeline', role: 'admin', timestamp: item.createdAt || new Date().toISOString() },
      { action: 'AI Verified', performedBy: 'RoadVanta AI', role: 'admin', timestamp: item.updatedAt || new Date().toISOString() }
    ],
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString()
  };
});

const outPath = path.join(__dirname, '../data/simulatedReports.json');
fs.writeFileSync(outPath, JSON.stringify(converted, null, 2), 'utf8');
console.log('Successfully saved ' + converted.length + ' simulated reports to: ' + outPath);
