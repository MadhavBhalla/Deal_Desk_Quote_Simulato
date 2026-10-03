from fastapi import FastAPI

from app.routers import catalog, health, quote

app = FastAPI(title="Deal Desk Quote Simulator API")

app.include_router(catalog.router)
app.include_router(health.router)
app.include_router(quote.router)
