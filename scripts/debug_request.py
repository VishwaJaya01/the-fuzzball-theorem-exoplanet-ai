import httpx

resp = httpx.get('http://127.0.0.1:7860/predict/by_tic', params={'tic_id': 286923464}, timeout=60.0)
print(resp.status_code)
print(resp.text)
