import requests
from urllib.parse import urljoin

API_BASE = "https://canvas.sfu.ca/api/v1/"

def list_files(course_id, token):
    files = []
    url = urljoin(API_BASE, f"courses/{course_id}/files")
    headers = {"Authorization": f"Bearer {token}"}
    while url:
        r = requests.get(url, headers=headers)
        r.raise_for_status()
        files.extend(r.json())
        url = r.links.get("next", {}).get("url")

    for f in files:
        f["direct_api_url"] = f"https://canvas.sfu.ca/api/v1/files/{f['id']}?access_token={token}"
    return files



def download_file(file_obj, token):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(file_obj["url"], headers=headers)
    r.raise_for_status()
    return r.content  # bytes