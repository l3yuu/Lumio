import requests

owner = "l3yuu"
repo = "Lumio"
run_id = 27212277015

url = f"https://api.github.com/repos/{owner}/{repo}/actions/runs/{run_id}/jobs"
print(f"Fetching jobs from {url}...")

try:
    response = requests.get(url, headers={"Accept": "application/vnd.github+json"}, timeout=10)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        jobs = data.get("jobs", [])
        for j in jobs:
            print(f"Job Name: {j['name']} | ID: {j['id']} | Status: {j['status']} | Conclusion: {j['conclusion']}")
            for step in j.get("steps", []):
                print(f"  Step: {step['name']} | Status: {step['status']} | Conclusion: {step['conclusion']}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Failed to fetch jobs: {e}")
