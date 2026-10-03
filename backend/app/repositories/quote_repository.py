import json
from pathlib import Path

# backend/app/repositories/quote_repository.py -> backend/data/quotes.json
QUOTES_PATH = Path(__file__).resolve().parents[2] / "data" / "quotes.json"


class QuoteNotFoundError(Exception):
    """Raised when a saved quote cannot be found."""


def _read_all() -> list[dict]:
    if not QUOTES_PATH.exists():
        return []
    with QUOTES_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def _write_all(quotes: list[dict]) -> None:
    QUOTES_PATH.parent.mkdir(parents=True, exist_ok=True)
    with QUOTES_PATH.open("w", encoding="utf-8") as f:
        json.dump(quotes, f, indent=2)


def list_quotes() -> list[dict]:
    """Return all saved quotes."""
    return _read_all()


def get_quote(quote_id: str) -> dict:
    """Return a single saved quote or raise QuoteNotFoundError."""
    for quote in _read_all():
        if quote["id"] == quote_id:
            return quote
    raise QuoteNotFoundError(f"Quote not found: {quote_id}")


def save_quote(quote: dict) -> dict:
    """Append a new saved quote to the store."""
    quotes = _read_all()
    quotes.append(quote)
    _write_all(quotes)
    return quote

def update_quote(quote: dict) -> dict:
    """Replace an existing saved quote by id."""
    quotes = _read_all()
    for index, existing in enumerate(quotes):
        if existing["id"] == quote["id"]:
            quotes[index] = quote
            _write_all(quotes)
            return quote
    raise QuoteNotFoundError(f"Quote not found: {quote['id']}")