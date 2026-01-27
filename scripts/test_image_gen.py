#!/usr/bin/env python3
import argparse
import base64
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv


def load_prompt(prompt_arg: str) -> str:
    if prompt_arg and os.path.isfile(prompt_arg):
        return Path(prompt_arg).read_text(encoding="utf-8").strip()
    return prompt_arg.strip()


def main() -> int:
    parser = argparse.ArgumentParser(description="Test OpenAI image generation")
    parser.add_argument(
        "--prompt",
        required=True,
        help="Prompt text or path to a .txt file with the prompt",
    )
    parser.add_argument(
        "--env",
        default=os.path.join(os.getcwd(), ".env"),
        help="Path to .env file",
    )
    parser.add_argument(
        "--out",
        default="output.png",
        help="Output image path",
    )
    args = parser.parse_args()

    load_dotenv(args.env)
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    model = os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1").strip()
    size = os.getenv("OPENAI_IMAGE_SIZE", "1024x1024").strip()
    prompt = load_prompt(args.prompt)

    if not api_key:
        print("OPENAI_API_KEY is missing", file=sys.stderr)
        return 1
    if not prompt:
        print("Prompt is empty", file=sys.stderr)
        return 1

    payload = {
        "model": model,
        "prompt": prompt,
        "size": size,
        "output_format": "png",
    }
    print(f"Using model={model} size={size}")
    response = requests.post(
        "https://api.openai.com/v1/images/generations",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=90,
    )
    print("Status:", response.status_code)
    if response.status_code >= 300:
        print(response.text)
        return 1
    data = response.json()
    image_data = (data.get("data") or [{}])[0]
    b64 = image_data.get("b64_json")
    if not b64:
        print("No image data returned", file=sys.stderr)
        return 1
    image_bytes = base64.b64decode(b64)
    Path(args.out).write_bytes(image_bytes)
    print("Saved:", args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
