# mazha Tap — Backend

FastAPI backend. Stateless — proxies Open-Meteo and runs decision logic.

## Run locally
```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Endpoints
- GET /health
- GET /weather/forecast?lat=&lon=&days=
- POST /decision/recommend
