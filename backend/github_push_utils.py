# backend/github_push_utils.py

from github import Github
import os
import uuid

def push_docs_to_github(token, repo_name, markdown_text, branch="main", path="docs.md"):
    request_id = str(uuid.uuid4())  # Unique request identifier for traceability
    try:
        g = Github(token)
        repo = g.get_repo(repo_name)

        contents = repo.get_contents(path, ref=branch)
        repo.update_file(
            path,
            "Update documentation",
            markdown_text,
            contents.sha,
            branch=branch
        )
        return f"Updated existing file: {path} | Request ID: {request_id}"

    except Exception as e:
        # File does not exist, so create it
        try:
            repo = g.get_repo(repo_name)
            repo.create_file(
                path,
                "Add documentation",
                markdown_text,
                branch=branch
            )
            return f"Created new file: {path} | Request ID: {request_id}"
        except Exception as inner_e:
            raise Exception(f"GitHub push failed [Request ID: {request_id}]: {str(inner_e)}")
