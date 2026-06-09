import requests

owner = "l3yuu"
repo = "Lumio"
job_id = 80344463972

url = f"https://api.github.com/repos/{owner}/{repo}/actions/jobs/{job_id}/logs"
print(f"Fetching logs from {url}...")

try:
    # We will try to download the logs. Since logs endpoint redirects, we must allow redirects.
    response = requests.get(url, allow_redirects=True, timeout=15)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        # The response is the raw log text
        log_lines = response.text.splitlines()
        print(f"Total log lines: {len(log_lines)}")
        
        # Look for "Verify Secrets Lengths" in the logs
        print("\n--- Search Results in Logs ---")
        found = False
        for i, line in enumerate(log_lines):
            if "Verify Secrets Lengths" in line or "VITE_GOOGLE_CLIENT_ID character length" in line or "VITE_API_BASE_URL character length" in line:
                found = True
                # Print a few lines around the match
                start = max(0, i - 2)
                end = min(len(log_lines), i + 5)
                for j in range(start, end):
                    print(f"[{j}]: {log_lines[j]}")
                print("-" * 30)
        if not found:
            print("Could not find the relevant log lines in the output.")
    else:
        print(f"Error: {response.status_code} - {response.text}")
except Exception as e:
    print(f"Failed to fetch logs: {e}")
