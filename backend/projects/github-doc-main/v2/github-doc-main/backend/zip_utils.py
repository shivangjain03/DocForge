# backend/zip_utils.py

import zipfile
import os
import uuid

# Allow parsing of specific file types
ALLOWED_EXTENSIONS = {
    '.py', '.js', '.ts', '.java', '.cpp', '.c', '.go', '.cs', '.html', '.css'
}

# Step 1: Save the uploaded ZIP file and extract it
def save_and_extract_zip(file, upload_dir="uploads"):
    # Create a unique folder to avoid overwrites
    repo_id = str(uuid.uuid4())
    zip_path = os.path.join(upload_dir, f"{repo_id}.zip")

    with open(zip_path, "wb") as buffer:
        buffer.write(file.file.read())

    extract_path = os.path.join(upload_dir, f"extracted_{repo_id}")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_path)

    return extract_path

# Step 2: Walk through extracted files and pull readable code
def extract_code_from_folder(folder_path):
    code = ""
    for root, _, files in os.walk(folder_path):
        for file in files:
            if any(file.endswith(ext) for ext in ALLOWED_EXTENSIONS):
                try:
                    with open(os.path.join(root, file), "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        code += f"\n# File: {file}\n" + content + "\n"
                except Exception as e:
                    print(f"Skipping {file}: {e}")
    return code
