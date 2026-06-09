import requests
import re

base_url = "https://lumio-henna-chi.vercel.app"
print(f"Fetching index.html from {base_url}...")

try:
    response = requests.get(base_url, timeout=10)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        html = response.text
        # Find all src in script tags using regex
        js_files = re.findall(r'<script[^>]*src=["\']([^"\']+)["\']', html)
        # Filter only assets
        js_urls = [base_url + src if src.startswith('/') else src for src in js_files if 'assets' in src]
        
        print(f"Found JS files: {js_urls}")
        
        for js_url in js_urls:
            print(f"\nFetching JS: {js_url}...")
            js_res = requests.get(js_url, timeout=10)
            if js_res.status_code == 200:
                content = js_res.text
                print(f"Content length: {len(content)}")
                
                # Let's search for accounts.id.initialize in the JS
                idx = content.find("accounts.id.initialize")
                if idx != -1:
                    print(f"Found string 'accounts.id.initialize' at index {idx}")
                    print(content[max(0, idx - 100):min(len(content), idx + 200)])
                else:
                    print("String 'accounts.id.initialize' not found in this JS file.")
                        
                # Let's search for our google client ID
                if "851581802414" in content:
                    print("FOUND GOOGLE CLIENT ID IN THIS JS FILE!")
                else:
                    print("Google client ID '851581802414' NOT found in this JS file.")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Failed: {e}")
