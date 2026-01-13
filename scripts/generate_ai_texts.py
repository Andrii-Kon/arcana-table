#!/usr/bin/env python3
import argparse
import json
import os
import re
import hashlib
import time
import urllib.error
import urllib.request
from pathlib import Path


CARDS_JS_PATH = Path(__file__).resolve().parents[1] / "data" / "cards.js"


def load_cards_from_js(path: Path):
    raw = path.read_text(encoding="utf-8")
    match = re.search(r"window\.TAROT_CARDS\s*=\s*(\[[\s\S]*?\])\s*;\s*\}\)\(\);", raw)
    if not match:
        raise RuntimeError(f"Could not find window.TAROT_CARDS array in {path}")
    cards = json.loads(match.group(1))
    prefix = raw[: match.start(1)]
    suffix = raw[match.end(1) :]
    return cards, prefix, suffix


def write_cards_to_js(path: Path, cards, prefix: str, suffix: str):
    serialized = json.dumps(cards, ensure_ascii=False, indent=2)
    path.write_text(f"{prefix}{serialized}{suffix}", encoding="utf-8")


def post_json(url: str, payload: dict, api_key: str, timeout_s: int = 90):
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout_s) as res:
        return json.loads(res.read().decode("utf-8"))


def try_read_http_error_body(exc: urllib.error.HTTPError) -> str:
    try:
        raw = exc.read()
        if not raw:
            return ""
        return raw.decode("utf-8", errors="replace")
    except Exception:
        return ""


def extract_output_text(response: dict) -> str:
    output = response.get("output", [])
    for item in output:
        if item.get("type") != "message":
            continue
        for content in item.get("content", []):
            if content.get("type") == "output_text":
                return content.get("text", "")
    raise RuntimeError("No output_text found in response")


def generate_for_card(*, api_key: str, model: str, lang: str, card: dict):
    name = card.get("name", "")
    arcana = card.get("arcana", "")
    keywords = card.get("upright", {}).get("keywordsList", []) or []
    scene = card.get("scene", "") or ""
    current_meanings = card.get("upright", {}).get("meanings", []) or []
    current_personal = card.get("upright", {}).get("personalized_interpretation", []) or []

    system = (
        "You write short, grounded tarot texts for a casual web game.\n"
        "No fatalistic claims. No health/legal/financial advice. No fear-mongering.\n"
        "Use second-person (you/your). Keep it warm, clear, and practical.\n"
        "meanings = general, canonical meaning of the card.\n"
        "personalized_interpretation = a personal interpretation addressed to the user.\n"
        "Never mention the card name, arcana, or 'tarot'.\n"
        "Avoid clichés (e.g., 'the universe', 'destiny', 'everything happens for a reason').\n"
        "Do not use ellipses.\n"
        "Output must be valid JSON only."
    )
    user = {
        "cardName": name,
        "arcana": arcana,
        "keywords": keywords,
        "scene": scene,
        "language": lang,
        "task": (
            "Paraphrase the existing texts (keep the same meaning, but rewrite wording).\n"
            "Return JSON with:\n"
            "- meanings: exactly 2 variants, each exactly 1 sentence (12–22 words). This is a general, canonical meaning of the card.\n"
            "- personalized_interpretation: exactly 2 variants, each exactly 1 sentence (10–18 words), actionable and supportive.\n"
            "Rules:\n"
            "- Do not repeat wording between meanings and personalized_interpretation.\n"
            "- Keep it non-judgmental and non-fatalistic.\n"
            "- Keep it consistent with the provided keywords/scene.\n"
            "- Never mention the card name/arcana.\n"
            "- No ellipses.\n"
        ),
        "existing": {
            "meanings": current_meanings,
            "personalized_interpretation": current_personal,
        },
    }

    payload = {
        "model": model,
        "input": [
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(user, ensure_ascii=False)},
        ],
        # Responses API: structured output is configured via `text.format`.
        "text": {
            "format": {
                "type": "json_schema",
                "name": "CardTexts",
                "schema": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "meanings": {
                            "type": "array",
                            "minItems": 2,
                            "maxItems": 2,
                            "items": {"type": "string"},
                        },
                        "personalized_interpretation": {
                            "type": "array",
                            "minItems": 2,
                            "maxItems": 2,
                            "items": {"type": "string"},
                        },
                    },
                    "required": ["meanings", "personalized_interpretation"],
                },
            }
        },
    }

    response = post_json("https://api.openai.com/v1/responses", payload, api_key=api_key)
    text = extract_output_text(response)
    return json.loads(text)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="gpt-5-mini", help="OpenAI model name")
    parser.add_argument("--lang", default="en", help="Output language code (en/uk)")
    parser.add_argument(
        "--limit", type=int, default=0, help="Generate only N cards (0 = all)"
    )
    parser.add_argument(
        "--sleep", type=float, default=0.2, help="Delay between requests (seconds)"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write results back into data/cards.js (upright.meanings + upright.personalized_interpretation)",
    )
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("Missing OPENAI_API_KEY env var")

    cache_path = Path(__file__).resolve().parents[1] / "data" / f"ai_cache_{args.lang}.json"
    cache = {}
    if cache_path.exists():
        cache = json.loads(cache_path.read_text(encoding="utf-8"))

    cards, prefix, suffix = load_cards_from_js(CARDS_JS_PATH)

    processed = 0
    for card in cards:
        slug = (card.get("name") or "").lower().replace(" ", "-")
        upright = card.get("upright", {}) or {}
        src = {
            "lang": args.lang,
            "meanings": upright.get("meanings", []) or [],
            "personalized_interpretation": upright.get("personalized_interpretation", []) or [],
        }
        src_hash = hashlib.sha1(
            json.dumps(src, ensure_ascii=False, sort_keys=True).encode("utf-8")
        ).hexdigest()[:12]
        cache_key = f"{slug}:{card.get('id','')}:{src_hash}"
        if cache_key in cache:
            if args.apply:
                result = cache[cache_key]
                upright = card.get("upright", {})
                upright["meanings"] = [s.strip() for s in result["meanings"]]
                upright["personalized_interpretation"] = [
                    s.strip() for s in result["personalized_interpretation"]
                ]
                card["upright"] = upright
                processed += 1
                print(f"[ok] {card.get('name')} (cached)")
                if args.limit and processed >= args.limit:
                    break
            continue
        result = None
        for attempt in range(4):
            try:
                result = generate_for_card(
                    api_key=api_key, model=args.model, lang=args.lang, card=card
                )
                break
            except urllib.error.HTTPError as exc:
                body = try_read_http_error_body(exc)
                detail = f"HTTP {exc.code}"
                if body:
                    body_one_line = " ".join(body.split())
                    detail = f"{detail}: {body_one_line[:220]}"
                wait = 2**attempt
                print(
                    f"[warn] {card.get('name')} failed: {detail} (retry in {wait}s)"
                )
                time.sleep(wait)
            except (urllib.error.URLError, json.JSONDecodeError) as exc:
                wait = 2**attempt
                print(f"[warn] {card.get('name')} failed: {exc} (retry in {wait}s)")
                time.sleep(wait)
        if result is None:
            raise SystemExit(f"Failed to generate for {card.get('name')}")

        cache[cache_key] = result
        cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")

        if args.apply:
            upright = card.get("upright", {})
            upright["meanings"] = [s.strip() for s in result["meanings"]]
            upright["personalized_interpretation"] = [
                s.strip() for s in result["personalized_interpretation"]
            ]
            card["upright"] = upright

        processed += 1
        print(f"[ok] {card.get('name')}")
        if args.limit and processed >= args.limit:
            break
        time.sleep(args.sleep)

    if args.apply:
        write_cards_to_js(CARDS_JS_PATH, cards, prefix, suffix)
        print(f"Wrote updated cards to {CARDS_JS_PATH}")
    else:
        print(f"Cache written to {cache_path} (run again with --apply to update cards.js)")


if __name__ == "__main__":
    main()
