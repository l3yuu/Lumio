import requests
import json

owner = "l3yuu"
repo = "Lumio"

url = f"https://api.github.com/repos/{owner}/{repo}/actions/runs"
print(f"Fetching runs from {url}...")

try:
    response = requests.get(url, headers={"Accept": "application/vnd.github+json"}, timeout=10)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        runs = data.get("workflow_runs", [])
        print(f"Found {len(runs)} runs:")
        for r in runs[:5]:
            print(f"ID: {r['id']} | Status: {r['status']} | Conclusion: {r['conclusion']} | Event: {r['event']} | Head SHA: {r['head_sha']}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Failed to fetch runs: {e}")
