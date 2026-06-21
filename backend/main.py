from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import weather, decision

app = FastAPI(title="mazha Tap API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather.router, prefix="/weather", tags=["weather"])
app.include_router(decision.router, prefix="/decision", tags=["decision"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "mazha-tap-api"}
