import datetime
from database import SessionLocal, Report, Detection

DEMO_REPORTS = [
    {
        "id": "PRISM-DEMO-001",
        "report_number": "PRISM-2026-101",
        "title": "Severe Pothole Cluster near Silk Board Flyover",
        "description": "Deep surface cavitation 40cm across on primary arterial lane.",
        "category": "pothole",
        "estimated_severity": "high",
        "priority_score": 88,
        "workflow_status": "under_inspection",
        "verification_status": "unverified_demo",
        "city": "Bengaluru",
        "address": "Silk Board Junction, Outer Ring Rd",
        "latitude": 12.9177,
        "longitude": 77.6229,
        "original_image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
        "is_demo": True,
        "source_note": "Simulated Demonstration Dataset",
        "detections_count": 2,
    },
    {
        "id": "PRISM-DEMO-002",
        "report_number": "PRISM-2026-102",
        "title": "Fatigue Alligator Cracking on BRTS Corridor",
        "description": "Interconnected pavement fissures across wheelpath.",
        "category": "road_crack",
        "estimated_severity": "moderate",
        "priority_score": 62,
        "workflow_status": "awaiting_review",
        "verification_status": "unverified_demo",
        "city": "Indore",
        "address": "AB Road, Near Vijay Nagar Square, Indore",
        "latitude": 22.7533,
        "longitude": 75.8937,
        "original_image_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
        "is_demo": True,
        "source_note": "Simulated Demonstration Dataset",
        "detections_count": 1,
    },
    {
        "id": "PRISM-DEMO-003",
        "report_number": "PRISM-2026-103",
        "title": "Stormwater Waterlogging & Asphalt Erosion",
        "description": "Standing water 15cm deep obscuring road surface defects.",
        "category": "waterlogging",
        "estimated_severity": "high",
        "priority_score": 82,
        "workflow_status": "submitted",
        "verification_status": "unverified_demo",
        "city": "Kanpur",
        "address": "Mall Road, Near Phool Bagh, Kanpur",
        "latitude": 26.4724,
        "longitude": 80.3388,
        "original_image_url": "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80",
        "is_demo": True,
        "source_note": "Simulated Demonstration Dataset",
        "detections_count": 1,
    },
    {
        "id": "PRISM-DEMO-004",
        "report_number": "PRISM-2026-104",
        "title": "Damaged Guardrail Barrier & Pavement Cavity",
        "description": "Concrete median impact fracture requiring civil dispatch.",
        "category": "road_obstruction",
        "estimated_severity": "high",
        "priority_score": 90,
        "workflow_status": "maintenance_planned",
        "verification_status": "unverified_demo",
        "city": "Lucknow",
        "address": "Gomti Nagar Shaheed Path Bypass, Lucknow",
        "latitude": 26.8503,
        "longitude": 80.9760,
        "original_image_url": "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80",
        "is_demo": True,
        "source_note": "Simulated Demonstration Dataset",
        "detections_count": 1,
    },
    {
        "id": "PRISM-DEMO-005",
        "report_number": "PRISM-2026-105",
        "title": "Asphalt Raveling & Minor Surface Depression",
        "description": "Gradual bitumen loss with aggregate breakout.",
        "category": "broken_surface",
        "estimated_severity": "low",
        "priority_score": 38,
        "workflow_status": "resolved",
        "verification_status": "unverified_demo",
        "city": "Varanasi",
        "address": "GT Road Mohansarai Chauraha, Varanasi",
        "latitude": 25.3182,
        "longitude": 82.9701,
        "original_image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
        "is_demo": True,
        "source_note": "Simulated Demonstration Dataset",
        "detections_count": 1,
    },
    {
        "id": "PRISM-DEMO-006",
        "report_number": "PRISM-2026-106",
        "title": "Deep Pothole at Highway Toll Approach",
        "description": "Cavity causing brake shocks on heavy commercial trucks.",
        "category": "pothole",
        "estimated_severity": "high",
        "priority_score": 86,
        "workflow_status": "confirmed",
        "verification_status": "unverified_demo",
        "city": "Unnao",
        "address": "NH-27 Industrial Leather Belt, Unnao",
        "latitude": 26.5380,
        "longitude": 80.4820,
        "original_image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
        "is_demo": True,
        "source_note": "Simulated Demonstration Dataset",
        "detections_count": 2,
    }
]

def seed_demo_data():
    db = SessionLocal()
    try:
        count = db.query(Report).count()
        if count == 0:
            print("[SEED] Seeding PRISM ROAD AI database with initial demo reports...")
            for r_data in DEMO_REPORTS:
                rep = Report(**r_data)
                db.add(rep)
            db.commit()
            print(f"[SEED] Successfully seeded {len(DEMO_REPORTS)} demo reports!")
        else:
            print(f"[SEED] Database already contains {count} reports.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
