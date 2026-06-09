import requests

js_url = "https://lumio-henna-chi.vercel.app/assets/index-0gOmxTrP.js"
print(f"Fetching JS from {js_url}...")

try:
    response = requests.get(js_url, timeout=10)
    if response.status_code == 200:
        content = response.text
        print(f"File fetched. Length: {len(content)}")
        
        # Search for onrender.com
        idx = content.find("onrender.com")
        if idx != -1:
            print("FOUND onrender.com in JS!")
            print(content[max(0, idx - 100):min(len(content), idx + 200)])
        else:
            print("onrender.com NOT found in JS.")
    else:
        print(f"Error: {response.status_code}")
except Exception as e:
    print(f"Failed: {e}")
