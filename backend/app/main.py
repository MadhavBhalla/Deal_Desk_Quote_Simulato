from fastapi import FastAPI

from app.routers import catalog, health

app = FastAPI(title="Deal Desk Quote Simulator API")

app.include_router(catalog.router)
app.include_router(health.router)
