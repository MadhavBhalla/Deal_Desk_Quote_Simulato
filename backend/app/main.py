from fastapi import FastAPI

from app.routers import catalog, health, quotes

app = FastAPI(title="Deal Desk Quote Simulator API")

app.include_router(catalog.router)
app.include_router(health.router)
app.include_router(quotes.router)
