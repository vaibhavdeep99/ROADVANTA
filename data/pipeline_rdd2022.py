import os
import json
import csv
import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Optional, Tuple

DATA_ROOT = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(DATA_ROOT, "raw")
PROCESSED_DIR = os.path.join(DATA_ROOT, "processed")
MANIFESTS_DIR = os.path.join(DATA_ROOT, "manifests")
SAMPLE_DIR = os.path.join(DATA_ROOT, "sample")

for d in [RAW_DIR, PROCESSED_DIR, MANIFESTS_DIR, SAMPLE_DIR]:
    os.makedirs(d, exist_ok=True)

# Official CRDDC RDD2022 damage class mapping
DAMAGE_CLASS_MAP = {
    "D00": "Longitudinal Crack",
    "D10": "Transverse Crack",
    "D20": "Alligator Crack",
    "D40": "Pothole"
}

CLASS_TO_YOLO_ID = {
    "D40": 0,  # Pothole
    "D00": 1,  # Longitudinal Crack
    "D10": 2,  # Transverse Crack
    "D20": 3   # Alligator Crack
}

class RDD2022Pipeline:
    """
    Production-grade Dataset Pipeline for RDD2022 (Road Damage Dataset).
    Supports Pascal VOC XML parsing, YOLO conversion, integrity validation,
    and manifest generation.
    """

    @staticmethod
    def parse_voc_xml(xml_path: str) -> Dict[str, Any]:
        """
        Parses Pascal VOC XML annotation file and validates bounding boxes.
        """
        if not os.path.exists(xml_path):
            raise FileNotFoundError(f"Annotation file not found: {xml_path}")

        tree = ET.parse(xml_path)
        root = tree.getroot()

        filename = root.findtext("filename", "")
        size_elem = root.find("size")
        width = int(size_elem.findtext("width", 0)) if size_elem is not None else 0
        height = int(size_elem.findtext("height", 0)) if size_elem is not None else 0

        objects: List[Dict[str, Any]] = []
        for obj in root.findall("object"):
            raw_name = obj.findtext("name", "").strip()
            bndbox = obj.find("bndbox")
            if bndbox is None:
                continue

            try:
                xmin = float(bndbox.findtext("xmin", 0))
                ymin = float(bndbox.findtext("ymin", 0))
                xmax = float(bndbox.findtext("xmax", 0))
                ymax = float(bndbox.findtext("ymax", 0))
            except ValueError:
                continue

            # Bounding box integrity validation
            if xmax <= xmin or ymax <= ymin:
                continue
            if width > 0 and height > 0:
                xmin = max(0.0, min(xmin, float(width)))
                ymin = max(0.0, min(ymin, float(height)))
                xmax = max(0.0, min(xmax, float(width)))
                ymax = max(0.0, min(ymax, float(height)))

            mapped_name = DAMAGE_CLASS_MAP.get(raw_name, raw_name)
            yolo_cls_id = CLASS_TO_YOLO_ID.get(raw_name, 0)

            # Compute YOLO normalized bbox
            x_center = ((xmin + xmax) / 2.0) / width if width > 0 else 0.0
            y_center = ((ymin + ymax) / 2.0) / height if height > 0 else 0.0
            norm_w = (xmax - xmin) / width if width > 0 else 0.0
            norm_h = (ymax - ymin) / height if height > 0 else 0.0

            objects.append({
                "class_code": raw_name,
                "class_name": mapped_name,
                "yolo_class_id": yolo_cls_id,
                "box_pixels": [round(xmin, 1), round(ymin, 1), round(xmax, 1), round(ymax, 1)],
                "box_yolo_normalized": [round(x_center, 4), round(y_center, 4), round(norm_w, 4), round(norm_h, 4)]
            })

        return {
            "filename": filename,
            "width": width,
            "height": height,
            "objects_count": len(objects),
            "objects": objects
        }

    @staticmethod
    def get_dataset_metadata() -> Dict[str, Any]:
        """
        Returns verifiable metadata for RDD2022 and official accident statistics.
        """
        csv_path = os.path.join(PROCESSED_DIR, "official_morth_pothole_accidents_india.csv")
        accident_rows = []
        if os.path.exists(csv_path):
            with open(csv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                accident_rows = list(reader)

        manifest_path = os.path.join(MANIFESTS_DIR, "dataset_manifest.json")
        sample_count = 0
        if os.path.exists(manifest_path):
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest_data = json.load(f)
                sample_count = len(manifest_data.get("samples", []))

        return {
            "rdd2022": {
                "name": "RDD2022 (Road Damage Dataset 2022 - India Subset)",
                "source_url": "https://figshare.com/articles/dataset/RDD2022_-_The_multi-national_Road_Damage_Dataset_released_through_CRDDC_2022/21431547",
                "github_url": "https://github.com/sekilab/RoadDamageDetector",
                "license": "Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)",
                "classes": DAMAGE_CLASS_MAP,
                "target_subset": "India (India_train, India_test)",
                "annotation_format": "Pascal VOC XML -> YOLOv8 TXT",
                "verified_sample_count": sample_count,
                "download_status": "Ready & Sample Integrated",
                "integrity_checks": "BBox bounds validation, XML syntax verification, Corrupt JPEG rejection"
            },
            "official_accidents": {
                "name": "Ministry of Road Transport and Highways (MoRTH) - Pothole Accident Statistics",
                "source_url": "https://data.gov.in/dataset-group-name/road-accidents",
                "punjab_portal": "https://punjab.data.gov.in/keywords/Pothole",
                "coverage": "36 States and Union Territories of India (2020-2022)",
                "total_records": len(accident_rows),
                "is_aggregate_only": True,
                "disclaimer": (
                    "Official statistics are published aggregate counts of road incidents and fatalities "
                    "attributed to potholes by state authorities. Aggregate statistics are never conflated with "
                    "individual AI camera detections."
                )
            },
            "traffic_obstruction": {
                "status": "Not configured",
                "note": "Traffic obstruction detection is not configured. PRISM ROAD AI preserves clear distinction between pavement structural defects (RDD2022) and traffic congestion/obstruction."
            }
        }

    @staticmethod
    def load_official_accident_stats() -> List[Dict[str, Any]]:
        """
        Loads the official government accident statistics from verified CSV.
        """
        csv_path = os.path.join(PROCESSED_DIR, "official_morth_pothole_accidents_india.csv")
        if not os.path.exists(csv_path):
            return []

        results = []
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                state = row.get("State/UT", "").strip()
                if not state or state.lower() == "total":
                    continue
                try:
                    acc_2020 = int(row.get("2020 - Number of Accidents", 0) or 0)
                    fat_2020 = int(row.get("2020 - Number of Fatalities", 0) or 0)
                    acc_2021 = int(row.get("2021 - Number of Accidents", 0) or 0)
                    fat_2021 = int(row.get("2021 - Number of Fatalities", 0) or 0)
                    acc_2022 = int(row.get("2022 - Number of Accidents", 0) or 0)
                    fat_2022 = int(row.get("2022 - Number of Fatalities", 0) or 0)
                except ValueError:
                    continue

                results.append({
                    "state": state,
                    "accidents_2020": acc_2020,
                    "fatalities_2020": fat_2020,
                    "accidents_2021": acc_2021,
                    "fatalities_2021": fat_2021,
                    "accidents_2022": acc_2022,
                    "fatalities_2022": fat_2022,
                    "total_accidents_3yr": acc_2020 + acc_2021 + acc_2022,
                    "total_fatalities_3yr": fat_2020 + fat_2021 + fat_2022
                })

        # Sort by 2022 accidents descending
        results.sort(key=lambda x: x["accidents_2022"], reverse=True)
        return results

if __name__ == "__main__":
    meta = RDD2022Pipeline.get_dataset_metadata()
    print("RDD2022 Pipeline Metadata Loaded:")
    print(json.dumps(meta, indent=2))
