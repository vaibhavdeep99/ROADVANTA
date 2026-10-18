import datetime
import uuid
from database import SessionLocal, Report, Detection, Review, engine, Base

RICH_ROAD_REPORTS = [
    {
        "id": "PRISM-2026-101",
        "report_number": "PRISM-2026-101",
        "title": "Severe Waterlogged Crater at Highway Approach",
        "description": "Deep 45cm asphalt cavitation holding stagnant rainwater. Causes severe braking shocks and axle damage on heavy freight trucks.",
        "category": "pothole",
        "estimated_severity": "high",
        "priority_score": 94,
        "workflow_status": "under_inspection",
        "verification_status": "verified",
        "city": "Unnao",
        "address": "NH-27 Industrial Leather Belt, Unnao, UP",
        "latitude": 26.5380,
        "longitude": 80.4820,
        "original_image_url": "/samples/sample_pothole_nh27.jpg",
        "model_name": "YOLOv8 Pothole Detector (RDD2022)",
        "model_confidence": 0.88,
        "detections_count": 2,
        "is_demo": True,
        "source_note": "Field Patrol Dashcam Telemetry",
        "detections": [
            {"class_name": "pothole", "confidence": 0.885, "x1": 0.05, "y1": 0.32, "x2": 0.78, "y2": 0.87, "apparent_area_pct": 42.1},
            {"class_name": "pothole", "confidence": 0.742, "x1": 0.12, "y1": 0.30, "x2": 0.91, "y2": 0.82, "apparent_area_pct": 43.5}
        ],
        "reviews": [
            {"reviewer_name": "PRISM AI Structural Engineer Agent", "decision": "CONFIRMED_HIGH_RISK", "notes": "Tier-1 Hazard: Significant cavitation with sub-base erosion. Dispatched to PWD Rapid Action Squad."}
        ]
    },
    {
        "id": "PRISM-2026-102",
        "report_number": "PRISM-2026-102",
        "title": "Gravelly Asphalt Void with Standing Water Pool",
        "description": "Sub-surface ballast displacement with sharp 12cm rim shear stress. Poses acute tire puncture risk for 2-wheelers.",
        "category": "pothole",
        "estimated_severity": "high",
        "priority_score": 91,
        "workflow_status": "confirmed",
        "verification_status": "verified",
        "city": "Unnao",
        "address": "Kanpur-Unnao Link Expressway Km 14, Unnao",
        "latitude": 26.5510,
        "longitude": 80.4950,
        "original_image_url": "/samples/sample_pothole_water1.png",
        "model_name": "YOLOv8 Pothole Detector (RDD2022)",
        "model_confidence": 0.92,
        "detections_count": 1,
        "is_demo": True,
        "source_note": "Citizen Mobile Report #9842",
        "detections": [
            {"class_name": "pothole", "confidence": 0.921, "x1": 0.25, "y1": 0.42, "x2": 0.62, "y2": 0.68, "apparent_area_pct": 21.4}
        ],
        "reviews": [
            {"reviewer_name": "PWD Highway Inspector", "decision": "confirmed", "notes": "Scheduled for cold-mix bitumen compaction within 24 hours."}
        ]
    },
    {
        "id": "PRISM-2026-103",
        "report_number": "PRISM-2026-103",
        "title": "Deep Pavement Cavity on High-Speed Highway Curve",
        "description": "Large water-filled crater spanning curved road section. Severe hydroplaning risk during precipitation.",
        "category": "pothole",
        "estimated_severity": "high",
        "priority_score": 96,
        "workflow_status": "maintenance_planned",
        "verification_status": "verified",
        "city": "Lucknow",
        "address": "Shaheed Path Bypass, Near Ekana Stadium, Lucknow",
        "latitude": 26.8020,
        "longitude": 80.9980,
        "original_image_url": "/samples/sample_pothole_water2.png",
        "model_name": "YOLOv8 Pothole Detector (RDD2022)",
        "model_confidence": 0.89,
        "detections_count": 1,
        "is_demo": True,
        "source_note": "UP Police Highway Patrol Telemetry",
        "detections": [
            {"class_name": "pothole", "confidence": 0.894, "x1": 0.18, "y1": 0.35, "x2": 0.79, "y2": 0.76, "apparent_area_pct": 34.2}
        ],
        "reviews": [
            {"reviewer_name": "PRISM AI Structural Agent", "decision": "CONFIRMED_HIGH_RISK", "notes": "Critical Tier-1: Located on high-speed deceleration radius. Immediate barrier and road patch required."}
        ]
    },
    {
        "id": "PRISM-2026-104",
        "report_number": "PRISM-2026-104",
        "title": "Multiple Pothole Cluster at Busy Commercial Junction",
        "description": "Continuous series of 8+ localized depressions with stagnant water near Karelibag crossroad, causing major urban bottleneck.",
        "category": "pothole",
        "estimated_severity": "high",
        "priority_score": 89,
        "workflow_status": "submitted",
        "verification_status": "verified",
        "city": "Vadodara",
        "address": "Jeevan Bharti Char Rasta, Karelibag, Vadodara, Gujarat",
        "latitude": 22.3160,
        "longitude": 73.1950,
        "original_image_url": "/samples/sample_vadodara_karelibag.png",
        "model_name": "YOLOv8 Pothole Detector (RDD2022)",
        "model_confidence": 0.86,
        "detections_count": 6,
        "is_demo": True,
        "source_note": "Municipal City Survey Unit",
        "detections": [
            {"class_name": "pothole", "confidence": 0.86, "x1": 0.34, "y1": 0.65, "x2": 0.72, "y2": 0.88, "apparent_area_pct": 18.5},
            {"class_name": "pothole", "confidence": 0.81, "x1": 0.44, "y1": 0.46, "x2": 0.68, "y2": 0.60, "apparent_area_pct": 12.3},
            {"class_name": "pothole", "confidence": 0.77, "x1": 0.12, "y1": 0.11, "x2": 0.42, "y2": 0.19, "apparent_area_pct": 15.0}
        ],
        "reviews": [
            {"reviewer_name": "Municipal Corporation Engineer", "decision": "under_inspection", "notes": "High traffic zone. Drainage desilting and asphalt hot-mix planned."}
        ]
    },
    {
        "id": "PRISM-2026-105",
        "report_number": "PRISM-2026-105",
        "title": "Multi-Point Longitudinal Pavement Crack & Cavitation",
        "description": "Extensive 60-meter continuous fracture line along rural connector road, indicating structural base failure.",
        "category": "road_crack",
        "estimated_severity": "high",
        "priority_score": 85,
        "workflow_status": "confirmed",
        "verification_status": "verified",
        "city": "Kanpur",
        "address": "GT Road Bypass, Near Jajmau Bridge, Kanpur",
        "latitude": 26.4380,
        "longitude": 80.3920,
        "original_image_url": "/samples/sample_cyber_multibox.png",
        "model_name": "YOLOv8 Multi-Defect Detector",
        "model_confidence": 0.87,
        "detections_count": 5,
        "is_demo": True,
        "source_note": "AI Survey Vehicle Camera 01",
        "detections": [
            {"class_name": "pothole", "confidence": 0.87, "x1": 0.46, "y1": 0.45, "x2": 0.64, "y2": 0.64, "apparent_area_pct": 14.2},
            {"class_name": "pothole", "confidence": 0.82, "x1": 0.46, "y1": 0.77, "x2": 0.65, "y2": 0.98, "apparent_area_pct": 16.5}
        ],
        "reviews": [
            {"reviewer_name": "NHAI Structural Auditor", "decision": "confirmed", "notes": "Full depth reclamation (FDR) and crack sealing recommended."}
        ]
    },
    {
        "id": "PRISM-2026-106",
        "report_number": "PRISM-2026-106",
        "title": "Fatigue Alligator Cracking on BRTS Transit Corridor",
        "description": "Interconnected multi-directional fatigue fissures across bus rapid transit wheelpath.",
        "category": "road_crack",
        "estimated_severity": "moderate",
        "priority_score": 64,
        "workflow_status": "under_inspection",
        "verification_status": "verified",
        "city": "Indore",
        "address": "AB Road, Near Vijay Nagar Square, Indore",
        "latitude": 22.7533,
        "longitude": 75.8937,
        "original_image_url": "/samples/sample_pothole_water1.png",
        "model_name": "YOLOv8 Pothole Detector",
        "model_confidence": 0.78,
        "detections_count": 1,
        "is_demo": True,
        "source_note": "Smart City Telemetry Feed",
        "detections": [
            {"class_name": "pothole", "confidence": 0.78, "x1": 0.22, "y1": 0.38, "x2": 0.58, "y2": 0.65, "apparent_area_pct": 18.0}
        ],
        "reviews": [
            {"reviewer_name": "Indore Municipal Smart City Cell", "decision": "under_inspection", "notes": "Inspection scheduled for overnight maintenance window."}
        ]
    },
    {
        "id": "PRISM-2026-107",
        "report_number": "PRISM-2026-107",
        "title": "Asphalt Raveling & Minor Surface Depression (Repaired)",
        "description": "Pothole filled with permanent asphalt cold patch. Pavement integrity restored to 95%.",
        "category": "broken_surface",
        "estimated_severity": "low",
        "priority_score": 32,
        "workflow_status": "resolved",
        "verification_status": "verified",
        "city": "Varanasi",
        "address": "GT Road Mohansarai Chauraha, Varanasi, UP",
        "latitude": 25.3182,
        "longitude": 82.9701,
        "original_image_url": "/samples/sample_clear_road.jpg",
        "model_name": "YOLOv8 Zero-Defect Baseline",
        "model_confidence": 0.95,
        "detections_count": 0,
        "is_demo": True,
        "source_note": "Post-Repair Inspection Audit",
        "detections": [],
        "reviews": [
            {"reviewer_name": "PWD Varanasi Circle", "decision": "resolved", "notes": "Permanent hot-mix patch applied on Oct 16. Road reopened with zero defects."}
        ]
    },
    {
        "id": "PRISM-2026-108",
        "report_number": "PRISM-2026-108",
        "title": "Severe Pothole Cluster near Ring Road Flyover",
        "description": "High-velocity lane crater with 30cm void causing traffic deceleration and collision hazard.",
        "category": "pothole",
        "estimated_severity": "high",
        "priority_score": 92,
        "workflow_status": "under_inspection",
        "verification_status": "verified",
        "city": "Delhi",
        "address": "Outer Ring Road, Mukarba Chowk Underpass, Delhi NCR",
        "latitude": 28.7350,
        "longitude": 77.1620,
        "original_image_url": "/samples/sample_pothole_nh27.jpg",
        "model_name": "YOLOv8 Pothole Detector",
        "model_confidence": 0.85,
        "detections_count": 2,
        "is_demo": True,
        "source_note": "Delhi Traffic Police Feed",
        "detections": [
            {"class_name": "pothole", "confidence": 0.85, "x1": 0.15, "y1": 0.35, "x2": 0.70, "y2": 0.80, "apparent_area_pct": 28.5}
        ],
        "reviews": [
            {"reviewer_name": "Delhi PWD Flying Squad", "decision": "under_inspection", "notes": "Emergency mastic asphalt team notified."}
        ]
    },
    {
        "id": "PRISM-2026-109",
        "report_number": "PRISM-2026-109",
        "title": "Transit Corridor Surface Void near Airport Approach",
        "description": "Rapidly deteriorating cavitation on primary tourist transit artery.",
        "category": "pothole",
        "estimated_severity": "moderate",
        "priority_score": 74,
        "workflow_status": "confirmed",
        "verification_status": "verified",
        "city": "Lucknow",
        "address": "VIP Road, Near Chaudhary Charan Singh Airport, Lucknow",
        "latitude": 26.7650,
        "longitude": 80.8840,
        "original_image_url": "/samples/sample_pothole_water1.png",
        "model_name": "YOLOv8 Pothole Detector",
        "model_confidence": 0.82,
        "detections_count": 1,
        "is_demo": True,
        "source_note": "Airport Transit Surveillance",
        "detections": [
            {"class_name": "pothole", "confidence": 0.82, "x1": 0.28, "y1": 0.40, "x2": 0.65, "y2": 0.72, "apparent_area_pct": 19.0}
        ],
        "reviews": [
            {"reviewer_name": "Lucknow Nagar Nigam", "decision": "confirmed", "notes": "Assigned to Zone 5 Pavement Division."}
        ]
    },
    {
        "id": "PRISM-2026-110",
        "report_number": "PRISM-2026-110",
        "title": "Monsoon Ballast Displacement & Pothole",
        "description": "Heavy rainfall runoff caused ballast gravel loss and a 35cm cavitation on arterial highway.",
        "category": "pothole",
        "estimated_severity": "high",
        "priority_score": 87,
        "workflow_status": "under_inspection",
        "verification_status": "verified",
        "city": "Assam",
        "address": "NH-37 Corridor, Near Khanapara, Guwahati, Assam",
        "latitude": 26.1150,
        "longitude": 91.8210,
        "original_image_url": "/samples/sample_pothole_water2.png",
        "model_name": "YOLOv8 Pothole Detector",
        "model_confidence": 0.88,
        "detections_count": 1,
        "is_demo": True,
        "source_note": "Assam PWD Road Safety Portal",
        "detections": [
            {"class_name": "pothole", "confidence": 0.88, "x1": 0.20, "y1": 0.38, "x2": 0.75, "y2": 0.75, "apparent_area_pct": 31.0}
        ],
        "reviews": [
            {"reviewer_name": "Guwahati Municipal Dev", "decision": "under_inspection", "notes": "Culvert drainage clearance and immediate aggregate fill required."}
        ]
    },
    {
        "id": "PRISM-2026-111",
        "report_number": "PRISM-2026-111",
        "title": "Suburban Road Bitumen Loss & Depression",
        "description": "Surface degradation over a 15m stretch near residential schooling zone.",
        "category": "broken_surface",
        "estimated_severity": "moderate",
        "priority_score": 68,
        "workflow_status": "maintenance_planned",
        "verification_status": "verified",
        "city": "Indore",
        "address": "Bhanwarkuan Main Road, Sector 3, Indore",
        "latitude": 22.6890,
        "longitude": 75.8650,
        "original_image_url": "/samples/sample_vadodara_karelibag.png",
        "model_name": "YOLOv8 Pothole Detector",
        "model_confidence": 0.76,
        "detections_count": 2,
        "is_demo": True,
        "source_note": "Citizen Traffic Safety Cell",
        "detections": [
            {"class_name": "pothole", "confidence": 0.76, "x1": 0.35, "y1": 0.50, "x2": 0.65, "y2": 0.80, "apparent_area_pct": 14.5}
        ],
        "reviews": [
            {"reviewer_name": "Indore Municipal Corporation", "decision": "maintenance_planned", "notes": "Contractor issued 48h work order for resurfacing."}
        ]
    },
    {
        "id": "PRISM-2026-112",
        "report_number": "PRISM-2026-112",
        "title": "Arterial Ring Road Pothole Fracture (Verified Resolved)",
        "description": "Emergency repair crew completed infrared joint sealing and cold compaction patch.",
        "category": "pothole",
        "estimated_severity": "low",
        "priority_score": 25,
        "workflow_status": "resolved",
        "verification_status": "verified",
        "city": "Bengaluru",
        "address": "Silk Board Junction, Outer Ring Rd, Bengaluru",
        "latitude": 12.9177,
        "longitude": 77.6229,
        "original_image_url": "/samples/sample_clear_road.jpg",
        "repair_image_url": "/evidence/repair_highway_paving.jpg",
        "model_name": "YOLOv8 Verification Baseline",
        "model_confidence": 0.94,
        "detections_count": 0,
        "is_demo": True,
        "source_note": "BBMP Pavement Resolution Proof",
        "detections": [],
        "reviews": [
            {"reviewer_name": "BBMP Assistant Engineer", "decision": "resolved", "notes": "Quality audit passed with zero vibration impact on transit sensors."}
        ]
    },
    {
        "id": "PRISM-2026-113",
        "report_number": "PRISM-2026-113",
        "title": "Dangling Traffic Signal at High-Speed Crossroad",
        "description": "Traffic light housing detached and dangling by loose electrical tether over active traffic lane. Extreme head-on collision and falling hazard.",
        "category": "traffic_signal_hazard",
        "estimated_severity": "high",
        "priority_score": 95,
        "workflow_status": "maintenance_planned",
        "verification_status": "verified",
        "city": "Unnao",
        "address": "Civil Lines Chauraha, Near Court Road, Unnao, UP",
        "latitude": 26.5450,
        "longitude": 80.4890,
        "original_image_url": "/samples/sample_broken_signal_dangling.jpg",
        "repair_image_url": None,
        "model_name": "Infrastructure Hazard Vision Model",
        "model_confidence": 0.96,
        "detections_count": 1,
        "is_demo": True,
        "source_note": "Traffic Police Telemetry Feed #04",
        "detections": [
            {"class_name": "traffic_signal_broken", "confidence": 0.962, "x1": 0.45, "y1": 0.20, "x2": 0.75, "y2": 0.80, "apparent_area_pct": 28.5}
        ],
        "reviews": [
            {"reviewer_name": "Unnao Traffic Division", "decision": "maintenance_planned", "notes": "Bucket truck crane dispatched for urgent signal remounting."}
        ]
    },
    {
        "id": "PRISM-2026-114",
        "report_number": "PRISM-2026-114",
        "title": "Fallen Traffic Signal Pole Blocking Sidewalk",
        "description": "Signal pole knocked down horizontally across pedestrian pathway and outer bicycle lane following storm impact.",
        "category": "traffic_signal_hazard",
        "estimated_severity": "high",
        "priority_score": 92,
        "workflow_status": "under_inspection",
        "verification_status": "verified",
        "city": "Vadodara",
        "address": "Sayajigunj Circle, Station Approach, Vadodara",
        "latitude": 22.3105,
        "longitude": 73.1812,
        "original_image_url": "/samples/sample_traffic_signal_fallen.jpg",
        "repair_image_url": None,
        "model_name": "Infrastructure Hazard Vision Model",
        "model_confidence": 0.91,
        "detections_count": 1,
        "is_demo": True,
        "source_note": "Citizen Mobile Safety Alert",
        "detections": [
            {"class_name": "signal_pole_collapsed", "confidence": 0.914, "x1": 0.15, "y1": 0.40, "x2": 0.85, "y2": 0.70, "apparent_area_pct": 32.0}
        ],
        "reviews": [
            {"reviewer_name": "VMC Electrical Dept", "decision": "under_inspection", "notes": "Cordoned with safety cones; pole replacement in progress."}
        ]
    },
    {
        "id": "PRISM-2026-115",
        "report_number": "PRISM-2026-115",
        "title": "Exposed Signal Wire Apparatus & Structural Corrosion",
        "description": "Aging traffic pole with open electrical terminal boxes and exposed copper wiring in public transit zone.",
        "category": "traffic_signal_hazard",
        "estimated_severity": "moderate",
        "priority_score": 79,
        "workflow_status": "awaiting_review",
        "verification_status": "pending",
        "city": "Kanpur",
        "address": "GT Road, Near Phool Bagh Crossing, Kanpur",
        "latitude": 26.4720,
        "longitude": 80.3510,
        "original_image_url": "/samples/sample_signal_damaged_wires.jpg",
        "repair_image_url": None,
        "model_name": "Infrastructure Hazard Vision Model",
        "model_confidence": 0.84,
        "detections_count": 1,
        "is_demo": True,
        "source_note": "Municipal Electrical Safety Patrol",
        "detections": [
            {"class_name": "electrical_wire_exposed", "confidence": 0.841, "x1": 0.20, "y1": 0.10, "x2": 0.65, "y2": 0.55, "apparent_area_pct": 24.8}
        ],
        "reviews": [
            {"reviewer_name": "Kanpur Nagar Nigam", "decision": "awaiting_review", "notes": "Assigned to Zone 2 electrical maintenance engineer."}
        ]
    },
    {
        "id": "PRISM-2026-116",
        "report_number": "PRISM-2026-116",
        "title": "PWD Rapid Action Squad - Cold-Mix Pothole Compaction (Verified Resolved)",
        "description": "Severe 40cm NH-27 cavitation filled with aggregate base and hot bitumen compaction. Official photographic proof verified by municipal engineer.",
        "category": "pothole",
        "estimated_severity": "low",
        "priority_score": 18,
        "workflow_status": "resolved",
        "verification_status": "verified",
        "city": "Unnao",
        "address": "NH-27 Km 18, Unnao Leather Industrial Belt, UP",
        "latitude": 26.5410,
        "longitude": 80.4850,
        "original_image_url": "/samples/sample_pothole_nh27.jpg",
        "repair_image_url": "/evidence/repair_asphalt_patching.jpg",
        "model_name": "YOLOv8 Verification Baseline",
        "model_confidence": 0.95,
        "detections_count": 0,
        "is_demo": True,
        "source_note": "PWD UP Rapid Action Verification Proof",
        "detections": [],
        "reviews": [
            {"reviewer_name": "PWD Executive Engineer - Unnao", "decision": "resolved", "notes": "Compacted with vibratory roller. 98.4% Proctor density achieved. Work Order #PWD-UP-8812 closed."}
        ]
    },
    {
        "id": "PRISM-2026-117",
        "report_number": "PRISM-2026-117",
        "title": "High-Speed Highway Corridor Paving & Joint Resurfacing (Verified Resolved)",
        "description": "Dual-lane asphalt paving completed over a 200m defective stretch with traffic cones and safety crew in place.",
        "category": "pothole",
        "estimated_severity": "low",
        "priority_score": 12,
        "workflow_status": "resolved",
        "verification_status": "verified",
        "city": "Lucknow",
        "address": "Lucknow-Kanpur Expressway Km 32, Lucknow, UP",
        "latitude": 26.7820,
        "longitude": 80.9120,
        "original_image_url": "/samples/sample_pothole_water1.png",
        "repair_image_url": "/evidence/repair_highway_paving.jpg",
        "model_name": "YOLOv8 Verification Baseline",
        "model_confidence": 0.98,
        "detections_count": 0,
        "is_demo": True,
        "source_note": "NHAI Pavement Quality Audit",
        "detections": [],
        "reviews": [
            {"reviewer_name": "NHAI Project Director", "decision": "resolved", "notes": "Continuous bituminous concrete overlay laid. Surface ride index compliant with IRC:SP:84-2019."}
        ]
    },
    {
        "id": "PRISM-2026-118",
        "report_number": "PRISM-2026-118",
        "title": "Ganga Barrage Approach Road Void",
        "description": "Heavy monsoon wash-out near barrage sluice gates approach. Water pooling inside 35cm crater.",
        "category": "pothole",
        "estimated_severity": "high",
        "priority_score": 88,
        "workflow_status": "confirmed",
        "verification_status": "verified",
        "city": "Kanpur",
        "address": "Ganga Barrage Road Km 2, Nawabganj, Kanpur, UP",
        "latitude": 26.5050,
        "longitude": 80.3320,
        "original_image_url": "/hazards/kanpur_pothole_water.jpg",
        "repair_image_url": None,
        "model_name": "YOLOv8 Pothole Detector (RDD2022)",
        "model_confidence": 0.87,
        "detections_count": 1,
        "is_demo": True,
        "source_note": "Kanpur Smart City Traffic Sensor",
        "detections": [
            {"class_name": "pothole", "confidence": 0.872, "x1": 0.20, "y1": 0.35, "x2": 0.70, "y2": 0.75, "apparent_area_pct": 27.5}
        ],
        "reviews": [
            {"reviewer_name": "Kanpur Development Authority", "decision": "confirmed", "notes": "Added to emergency monsoon resurfacing schedule."}
        ]
    }
]

def seed_rich_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if database already has reports
        existing_count = db.query(Report).count()
        if existing_count >= len(RICH_ROAD_REPORTS):
            print(f"[SEED] Database already populated with {existing_count} reports.")
            return

        # Clear existing demo reports to refresh with rich multi-incident dataset
        db.query(Detection).delete()
        db.query(Review).delete()
        db.query(Report).delete()
        db.commit()

        print(f"[SEED] Inserting {len(RICH_ROAD_REPORTS)} rich Indian road damage incidents into SQLite...")
        for r_data in RICH_ROAD_REPORTS:
            r_copy = dict(r_data)
            detections_data = r_copy.pop("detections", [])
            reviews_data = r_copy.pop("reviews", [])

            rep = Report(**r_copy)
            db.add(rep)
            db.flush()

            for d in detections_data:
                det = Detection(report_id=rep.id, **d)
                db.add(det)

            for rev in reviews_data:
                r = Review(report_id=rep.id, **rev)
                db.add(r)

        db.commit()
        print(f"[SEED] Successfully populated database with {len(RICH_ROAD_REPORTS)} verified Indian road incidents!")
    finally:
        db.close()

seed_demo_data = seed_rich_data

if __name__ == "__main__":
    seed_rich_data()
