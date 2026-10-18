import os
import sys
import zipfile
import shutil
from pathlib import Path

# Paths
ZIP_PATH = r"C:\Users\Lenovo\Music\Downloads\archive (1).zip"
WORK_DIR = Path(r"c:\Users\Lenovo\OneDrive\Pictures\Desktop\RoadVantaAI\data\local_training")
SUBSET_IMG_TRAIN = WORK_DIR / "images" / "train"
SUBSET_LBL_TRAIN = WORK_DIR / "labels" / "train"
SUBSET_IMG_VAL = WORK_DIR / "images" / "val"
SUBSET_LBL_VAL = WORK_DIR / "labels" / "val"
MODELS_DIR = Path(r"c:\Users\Lenovo\OneDrive\Pictures\Desktop\RoadVantaAI\prism_backend\models")

for d in [SUBSET_IMG_TRAIN, SUBSET_LBL_TRAIN, SUBSET_IMG_VAL, SUBSET_LBL_VAL, MODELS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

print(f"[*] Reading dataset archive from: {ZIP_PATH}")
if not os.path.exists(ZIP_PATH):
    print(f"[!] Archive not found at {ZIP_PATH}")
    sys.exit(1)

# Step 1: Extract high-value India road damage images (focused on potholes & cracks)
print("[*] Extracting curated India damage samples from archive...")
with zipfile.ZipFile(ZIP_PATH, 'r') as z:
    all_names = z.namelist()
    
    # Filter non-empty India train labels
    train_labels = [n for n in all_names if n.startswith("RDD_SPLIT/train/labels/India_") and z.getinfo(n).file_size > 0]
    val_labels = [n for n in all_names if n.startswith("RDD_SPLIT/val/labels/India_") and z.getinfo(n).file_size > 0]
    
    print(f"[*] Found {len(train_labels)} annotated India training images, {len(val_labels)} val images.")
    
    # Select 250 train and 50 val samples for fast, high-quality CPU fine-tuning
    selected_train = train_labels[:250]
    selected_val = val_labels[:50]
    
    for lbl_path in selected_train:
        base_name = os.path.basename(lbl_path)
        img_name = base_name.replace('.txt', '.jpg')
        img_path = f"RDD_SPLIT/train/images/{img_name}"
        
        # Extract label
        with open(SUBSET_LBL_TRAIN / base_name, 'wb') as f:
            f.write(z.read(lbl_path))
            
        # Extract image if exists
        if img_path in all_names:
            with open(SUBSET_IMG_TRAIN / img_name, 'wb') as f:
                f.write(z.read(img_path))
                
    for lbl_path in selected_val:
        base_name = os.path.basename(lbl_path)
        img_name = base_name.replace('.txt', '.jpg')
        img_path = f"RDD_SPLIT/val/images/{img_name}"
        
        with open(SUBSET_LBL_VAL / base_name, 'wb') as f:
            f.write(z.read(lbl_path))
            
        if img_path in all_names:
            with open(SUBSET_IMG_VAL / img_name, 'wb') as f:
                f.write(z.read(img_path))

train_count = len(list(SUBSET_IMG_TRAIN.glob("*.jpg")))
val_count = len(list(SUBSET_IMG_VAL.glob("*.jpg")))
print(f"[+] Successfully prepared {train_count} train images and {val_count} val images.")

# Step 2: Write data.yaml configuration
yaml_content = f"""path: {WORK_DIR.as_posix()}
train: images/train
val: images/val

names:
  0: longitudinal_crack
  1: transverse_crack
  2: alligator_crack
  3: pothole
  4: road_defect_cluster
"""

yaml_path = WORK_DIR / "dataset.yaml"
with open(yaml_path, "w", encoding="utf-8") as f:
    f.write(yaml_content)

print(f"[+] Created YOLO dataset YAML at: {yaml_path}")

# Step 3: Run YOLOv8 Fine-tuning
print("[*] Initializing Ultralytics YOLOv8 nano transfer learning...")
import torch
torch.set_num_threads(min(8, os.cpu_count() or 4))

from ultralytics import YOLO

# Load base pretrained weights (yolov8n.pt will auto-download if not present)
model = YOLO("yolov8n.pt")

print("[*] Starting training epochs on RDD2022 dataset...")
results = model.train(
    data=str(yaml_path),
    epochs=5,
    imgsz=640,
    batch=8,
    name="roadvanta_rdd_model",
    project=str(WORK_DIR / "runs"),
    device="cpu",
    workers=2,
    patience=5,
    save=True,
    verbose=True
)

# Step 4: Copy best.pt into prism_backend/models/best.pt
best_weights = WORK_DIR / "runs" / "roadvanta_rdd_model" / "weights" / "best.pt"
target_weights = MODELS_DIR / "best.pt"

if best_weights.exists():
    shutil.copy(best_weights, target_weights)
    print(f"\n[SUCCESS] Custom model weights saved to: {target_weights}")
    print(f"[SUCCESS] Size: {target_weights.stat().st_size / (1024*1024):.2f} MB")
else:
    print(f"[!] Warning: {best_weights} not found, checking last.pt...")
    last_weights = WORK_DIR / "runs" / "roadvanta_rdd_model" / "weights" / "last.pt"
    if last_weights.exists():
        shutil.copy(last_weights, target_weights)
        print(f"\n[SUCCESS] Copied last.pt to: {target_weights}")

print("[+] Training completed successfully!")
