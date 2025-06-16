# git_utils.py

import git
import os
import uuid

def clone_repo(repo_url, base_path="uploads"):
    repo_id = str(uuid.uuid4())
    clone_path = os.path.join(base_path, f"repo_{repo_id}")

    try:
        print(f"Cloning repo from: {repo_url} into: {clone_path}")
        git.Repo.clone_from(repo_url, clone_path)
        return clone_path
    except Exception as e:
        print(f"[ERROR] Git clone failed: {e}")
        raise Exception(f"Failed to clone repo: {str(e)}")
