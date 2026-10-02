from fastapi import FastAPI
import json

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Deal Desk Quote Simulator API"}


@app.get("/api/catalog")
def get_catalog():
    with open("data/catalog.json", "r") as file:
        catalog = json.load(file)

    return catalog