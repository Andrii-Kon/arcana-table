#!/usr/bin/env python3
"""
Flask API для нумерологической системы.
Предоставляет REST API endpoints для расчета нумерологических чисел.
"""

from flask import Flask, jsonify, request, send_from_directory, redirect, make_response
from flask_cors import CORS
from datetime import datetime, date
from numerology_system import (
    NumerologyCalculator,
    NumerologyProfile,
    NUMBER_MEANINGS
)
from numerology_compatibility import CompatibilityCalculator
import os
import time
import requests
import jwt
from jwt import PyJWKClient
from typing import Optional
import base64
import threading
import re
import secrets
import json
try:
    from dotenv import load_dotenv
except Exception:
    load_dotenv = None


def calculate_formulas(full_name: str, birth_date: date, current_date: date) -> dict:
    """Рассчитывает формулы для отображения"""
    formulas = {}
    
    # Life Path формула
    day_digits = [int(d) for d in str(birth_date.day)]
    month_digits = [int(d) for d in str(birth_date.month)]
    year_digits = [int(d) for d in str(birth_date.year)]
    life_path_sum = sum(day_digits + month_digits + year_digits)
    formulas["life_path"] = {
        "description": "Add every digit in your birth date, then reduce",
        "steps": [
            f"Day: {birth_date.day} -> {''.join(map(str, day_digits))}",
            f"Month: {birth_date.month} -> {''.join(map(str, month_digits))}",
            f"Year: {birth_date.year} -> {''.join(map(str, year_digits))}",
            f"Sum: {' + '.join(map(str, day_digits + month_digits + year_digits))} = {life_path_sum}",
            f"Reduce: {life_path_sum} -> {NumerologyCalculator.reduce_to_single_digit(life_path_sum, True)}"
        ]
    }
    
    # Destiny формула
    name_letters = []
    name_values = []
    for char in full_name:
        if char.isalpha():
            name_letters.append(char.upper())
            val = NumerologyCalculator.letter_to_number(char)
            name_values.append(val)
    destiny_sum = sum(name_values)
    
    # Формируем полную формулу со всеми буквами
    letters_str = ', '.join(name_letters)
    values_str = ', '.join(map(str, name_values))
    sum_str = ' + '.join(map(str, name_values))
    
    formulas["destiny"] = {
        "description": "Add the values of every letter in your name",
        "steps": [
            f"Name: {full_name}",
            f"Letters ({len(name_letters)}): {letters_str}",
            f"Values: {values_str}",
            f"Sum: {sum_str} = {destiny_sum}",
            f"Reduce: {destiny_sum} -> {NumerologyCalculator.reduce_to_single_digit(destiny_sum, True)}"
        ]
    }
    
    # Soul формула (гласные)
    vowels = []
    vowel_values = []
    for char in full_name:
        if char.upper() in {'A', 'E', 'I', 'O', 'U', 'Y', 'А', 'Е', 'Ё', 'И', 'О', 'У', 'Ы', 'Э', 'Ю', 'Я'}:
            vowels.append(char.upper())
            val = NumerologyCalculator.letter_to_number(char)
            vowel_values.append(val)
    soul_sum = sum(vowel_values) if vowel_values else 0
    formulas["soul"] = {
        "description": "Add the values of the vowels only",
        "steps": [
            f"Name: {full_name}",
            f"Vowels: {', '.join(vowels) if vowels else 'none'}",
            f"Values: {', '.join(map(str, vowel_values)) if vowel_values else '0'}",
            f"Sum: {' + '.join(map(str, vowel_values)) if vowel_values else '0'} = {soul_sum}",
            f"Reduce: {soul_sum} -> {NumerologyCalculator.reduce_to_single_digit(soul_sum, True)}"
        ]
    }
    
    # Personality формула (согласные)
    consonants = []
    consonant_values = []
    for char in full_name:
        if char.isalpha() and char.upper() not in {'A', 'E', 'I', 'O', 'U', 'Y', 'А', 'Е', 'Ё', 'И', 'О', 'У', 'Ы', 'Э', 'Ю', 'Я'}:
            consonants.append(char.upper())
            val = NumerologyCalculator.letter_to_number(char)
            consonant_values.append(val)
    personality_sum = sum(consonant_values) if consonant_values else 0
    
    # Формируем полную формулу со всеми согласными
    if consonants:
        consonants_str = ', '.join(consonants)
        consonant_values_str = ', '.join(map(str, consonant_values))
        consonant_sum_str = ' + '.join(map(str, consonant_values))
    else:
        consonants_str = "none"
        consonant_values_str = "0"
        consonant_sum_str = "0"
    
    formulas["personality"] = {
        "description": "Add the values of the consonants only",
        "steps": [
            f"Name: {full_name}",
            f"Consonants ({len(consonants)}): {consonants_str}",
            f"Values: {consonant_values_str}",
            f"Sum: {consonant_sum_str} = {personality_sum}",
            f"Reduce: {personality_sum} -> {NumerologyCalculator.reduce_to_single_digit(personality_sum, True)}"
        ]
    }
    
    # Personal Year формула
    month_digits_py = [int(d) for d in str(birth_date.month)]
    day_digits_py = [int(d) for d in str(birth_date.day)]
    year_digits_py = [int(d) for d in str(current_date.year)]
    py_sum = sum(month_digits_py + day_digits_py + year_digits_py)
    all_digits_py = month_digits_py + day_digits_py + year_digits_py
    
    # Формируем понятное отображение
    month_display = f"{birth_date.month} -> digits: {', '.join(map(str, month_digits_py))}"
    day_display = f"{birth_date.day} -> digits: {', '.join(map(str, day_digits_py))}"
    year_display = f"{current_date.year} -> digits: {', '.join(map(str, year_digits_py))}"
    
    formulas["personal_year"] = {
        "description": "Add the digits of birth month, birth day, and the current year",
        "steps": [
            f"Birth month: {month_display}",
            f"Birth day: {day_display}",
            f"Current year: {year_display}",
            f"All digits: {', '.join(map(str, all_digits_py))}",
            f"Sum: {' + '.join(map(str, all_digits_py))} = {py_sum}",
            f"Reduce: {py_sum} -> {NumerologyCalculator.reduce_to_single_digit(py_sum, True)}"
        ]
    }
    
    # Personal Month формула
    personal_year = NumerologyCalculator.calculate_personal_year(birth_date, current_date)
    month_num = current_date.month
    pm_sum = personal_year + month_num
    formulas["personal_month"] = {
        "description": "Personal year plus the current month",
        "steps": [
            f"Personal year: {personal_year}",
            f"Month number ({current_date.strftime('%B')}): {month_num}",
            f"Sum: {personal_year} + {month_num} = {pm_sum}",
            f"Reduce: {pm_sum} -> {NumerologyCalculator.reduce_to_single_digit(pm_sum, True)}"
        ]
    }
    
    # Personal Day формула
    personal_month = NumerologyCalculator.calculate_personal_month(birth_date, current_date)
    day_num = current_date.day
    day_digits_pd = [int(d) for d in str(day_num)]
    day_sum = sum(day_digits_pd)
    pd_total = personal_month + day_sum
    formulas["personal_day"] = {
        "description": "Personal month plus the digits of today",
        "steps": [
            f"Personal month: {personal_month}",
            f"Day of month: {day_num} -> {''.join(map(str, day_digits_pd))}",
            f"Sum of day digits: {' + '.join(map(str, day_digits_pd))} = {day_sum}",
            f"Sum: {personal_month} + {day_sum} = {pd_total}",
            f"Reduce: {pd_total} -> {NumerologyCalculator.reduce_to_single_digit(pd_total, True)}"
        ]
    }
    
    return formulas

if load_dotenv:
    load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = BASE_DIR
NUMEROLOGY_DIR = os.path.join(ROOT_DIR, 'numerology_static')
PALMISTRY_DIR = os.path.join(ROOT_DIR, 'palmistry_static')
DATA_DIR = os.path.join(ROOT_DIR, 'data')
ASSETS_DIR = os.path.join(ROOT_DIR, 'assets')
AUTH_HTML = os.path.join(ROOT_DIR, 'auth.html')
CONFIG_JS = os.path.join(ROOT_DIR, 'config.js')
AUTH_JS = os.path.join(ROOT_DIR, 'auth.js')

SUPABASE_URL = os.getenv('SUPABASE_URL', '').strip()
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', '').strip()
SUPABASE_JWKS_URL = os.getenv('SUPABASE_JWKS_URL', '').strip()
if not SUPABASE_JWKS_URL and SUPABASE_URL:
    SUPABASE_JWKS_URL = SUPABASE_URL.rstrip('/') + '/auth/v1/keys'


SERVICE_ROLE_KEY = os.getenv('SERVICE_ROLE_KEY', '').strip()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '').strip()
OPENAI_IMAGE_MODEL = os.getenv('OPENAI_IMAGE_MODEL', 'gpt-image-1').strip() or 'gpt-image-1'
OPENAI_IMAGE_SIZE = os.getenv('OPENAI_IMAGE_SIZE', '1024x1024').strip() or '1024x1024'
OPENAI_TEXT_MODEL = os.getenv('OPENAI_TEXT_MODEL', 'gpt-4o-mini').strip() or 'gpt-4o-mini'
SOULMATE_IMAGE_DIR = os.getenv('SOULMATE_IMAGE_DIR', '').strip()
ADMIN_TOKEN = os.getenv('ADMIN_TOKEN', '').strip()
DEV_MAGIC_LINK = os.getenv('DEV_MAGIC_LINK', '').strip().lower() in ('1', 'true', 'yes', 'on')
SOULMATE_IMAGE_PROMPT = os.getenv('SOULMATE_IMAGE_PROMPT', '').strip() or (
    'A dreamy, romantic soulmate portrait, soft lighting, pastel palette, cinematic depth of field.'
)
if not SOULMATE_IMAGE_DIR:
    SOULMATE_IMAGE_DIR = os.path.join(DATA_DIR, 'soulmate_images')

_jwks_client = None
_jwks_client_set_at = 0


def _get_jwks_client() -> Optional[PyJWKClient]:
    global _jwks_client, _jwks_client_set_at
    if not SUPABASE_JWKS_URL:
        return None
    now = time.time()
    if _jwks_client and now - _jwks_client_set_at < 6 * 60 * 60:
        return _jwks_client
    _jwks_client = PyJWKClient(SUPABASE_JWKS_URL)
    _jwks_client_set_at = now
    return _jwks_client


def verify_access_token(token: str) -> bool:
    if not token:
        return False
    if SUPABASE_URL and SUPABASE_ANON_KEY:
        try:
            response = requests.get(
                SUPABASE_URL.rstrip('/') + '/auth/v1/user',
                headers={
                    'Authorization': f'Bearer {token}',
                    'apikey': SUPABASE_ANON_KEY,
                },
                timeout=6,
            )
            if response.status_code == 200:
                return True
        except Exception:
            pass
    client = _get_jwks_client()
    if not client:
        return False
    try:
        signing_key = client.get_signing_key_from_jwt(token).key
        jwt.decode(
            token,
            signing_key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
            options={"verify_exp": True},
        )
        return True
    except Exception:
        return False


def is_authenticated(req) -> bool:
    token = req.cookies.get('sb_access')
    return verify_access_token(token)


def is_auth_allowed(path: str) -> bool:
    if path.startswith('/auth'):
        return True
    if path in ['/styles.css', '/magic-layer.css', '/config.js', '/auth.js', '/favicon.ico']:
        return True
    if path == '/forget-password' or path.startswith('/forget-password/'):
        return True
    if path.startswith('/reset-password'):
        return True
    if path.startswith('/assets'):
        return True
    if path.startswith('/api/session') or path.startswith('/api/logout'):
        return True
    if path.startswith('/api/grant-access'):
        return True
    return False



def _get_supabase_admin_headers():
    if not SERVICE_ROLE_KEY:
        return None
    return {
        'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
        'apikey': SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
    }


def _get_default_redirect_url():
    redirect_url = os.getenv('SUPABASE_REDIRECT_URL', '').strip() or os.getenv('SUPABASE_REDIRECT', '').strip()
    if redirect_url:
        return redirect_url
    try:
        return request.url_root.rstrip('/') + '/auth/callback'
    except Exception:
        return ''


def _safe_email_key(email: str) -> str:
    if not email:
        return 'user'
    key = re.sub(r'[^a-z0-9]+', '_', email.lower()).strip('_')
    return key or 'user'


def _ensure_soulmate_dir():
    os.makedirs(SOULMATE_IMAGE_DIR, exist_ok=True)


def _soulmate_lock_path(key: str) -> str:
    return os.path.join(SOULMATE_IMAGE_DIR, f"{key}.lock")


def _soulmate_image_paths(user_id, email):
    paths = []
    if user_id:
        paths.append(os.path.join(SOULMATE_IMAGE_DIR, f"{user_id}.png"))
    if email:
        paths.append(os.path.join(SOULMATE_IMAGE_DIR, f"{_safe_email_key(email)}.png"))
    return paths


def _find_soulmate_image(user_id, email):
    _ensure_soulmate_dir()
    if user_id and email:
        user_path = os.path.join(SOULMATE_IMAGE_DIR, f"{user_id}.png")
        email_path = os.path.join(SOULMATE_IMAGE_DIR, f"{_safe_email_key(email)}.png")
        if not os.path.exists(user_path) and os.path.exists(email_path):
            try:
                os.rename(email_path, user_path)
            except Exception:
                pass
        if os.path.exists(user_path):
            return user_path
    for path in _soulmate_image_paths(user_id, email):
        if os.path.exists(path):
            return path
    return None


def _is_soulmate_processing(user_id, email):
    _ensure_soulmate_dir()
    keys = []
    if user_id:
        keys.append(user_id)
    if email:
        keys.append(_safe_email_key(email))
    return any(os.path.exists(_soulmate_lock_path(k)) for k in keys)


def _format_quiz_context(quiz):
    if not quiz:
        return ''
    if isinstance(quiz, str):
        return quiz.strip()
    if isinstance(quiz, list):
        lines = []
        for item in quiz:
            if isinstance(item, dict):
                question = str(item.get('question') or item.get('q') or '').strip()
                answer = item.get('answer') or item.get('a') or item.get('value') or ''
                if isinstance(answer, list):
                    answer = ', '.join([str(entry) for entry in answer if entry])
                answer = str(answer).strip()
                if question and answer:
                    lines.append(f"{question}: {answer}")
                elif answer:
                    lines.append(answer)
            elif item:
                lines.append(str(item).strip())
        return '\n'.join([line for line in lines if line])
    if isinstance(quiz, dict):
        lines = []
        for key, value in quiz.items():
            key_text = str(key).strip()
            if isinstance(value, list):
                value_text = ', '.join([str(entry) for entry in value if entry])
            else:
                value_text = str(value).strip()
            if key_text and value_text:
                lines.append(f"{key_text}: {value_text}")
            elif value_text:
                lines.append(value_text)
        return '\n'.join([line for line in lines if line])
    return str(quiz).strip()


def _extract_response_text(data):
    if not isinstance(data, dict):
        return None
    if data.get('output_text'):
        return str(data.get('output_text')).strip()
    output_items = data.get('output') or []
    for item in output_items:
        if item.get('type') != 'message':
            continue
        for content in item.get('content') or []:
            if content.get('type') == 'output_text' and content.get('text'):
                return str(content.get('text')).strip()
    return None


def _generate_soulmate_prompt(quiz_context: str):
    if not OPENAI_API_KEY or not OPENAI_TEXT_MODEL:
        return None, 'OPENAI_TEXT_MODEL missing.'
    trimmed_context = (quiz_context or '').strip()
    if not trimmed_context:
        return None, 'Quiz context missing.'
    if len(trimmed_context) > 2000:
        trimmed_context = trimmed_context[:2000]
    payload = {
        'model': OPENAI_TEXT_MODEL,
        'input': [
            {
                'role': 'system',
                'content': (
                    'You are a prompt engineer. Write a vivid, prompt for an AI model'
                    'that generates a hand-drawn soulmate portrait, based on the all quiz answers. Only soulmate portrait on the image, specify that, that sould be only one person on image (soulmate).'
                    'Keep it tasteful, adult, and safe (no minors, no explicit nudity). Use soft '
                    'lighting, cinematic depth of field, and a dreamy, elegant style. Do not '
                    'mention "quiz" or "answers". Output only the prompt, no quotes.'
                ),
            },
            {
                'role': 'user',
                'content': f"Quiz answers:\n{trimmed_context}",
            },
        ],
    }
    try:
        response = requests.post(
            'https://api.openai.com/v1/responses',
            headers={
                'Authorization': f'Bearer {OPENAI_API_KEY}',
                'Content-Type': 'application/json',
            },
            json=payload,
            timeout=30,
        )
        if response.status_code >= 300:
            return None, response.text
        data = response.json() if response.content else {}
        text = _extract_response_text(data)
        return text, None
    except Exception as exc:
        return None, str(exc)


def _get_authenticated_user():
    token = request.cookies.get('sb_access')
    if not token or not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return None
    try:
        response = requests.get(
            SUPABASE_URL.rstrip('/') + '/auth/v1/user',
            headers={
                'Authorization': f'Bearer {token}',
                'apikey': SUPABASE_ANON_KEY,
            },
            timeout=6,
        )
        if response.status_code == 200:
            return response.json()
    except Exception:
        return None
    return None


def _invite_user(email, full_name=None, redirect_url=None):
    headers = _get_supabase_admin_headers()
    if not headers or not SUPABASE_URL:
        return None, 'Supabase admin key is missing.'
    payload = {'email': email}
    if full_name:
        payload['data'] = {'full_name': full_name}
    if redirect_url:
        payload['redirect_to'] = redirect_url
    base = SUPABASE_URL.rstrip('/')
    invite_urls = [
        f'{base}/auth/v1/invite',
        f'{base}/auth/v1/admin/invite',
    ]
    response = None
    for url in invite_urls:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=10,
        )
        if response.status_code != 404:
            break
    if not response:
        return None, 'Invite request failed.'
    if response.status_code >= 300:
        try:
            return None, response.json()
        except Exception:
            return None, response.text
    data = response.json() if response.content else {}
    user_id = data.get('id') or data.get('user', {}).get('id')
    return user_id, None


def _extract_action_link(data):
    if not isinstance(data, dict):
        return None
    if data.get('action_link'):
        return data.get('action_link')
    properties = data.get('properties') or {}
    if isinstance(properties, dict) and properties.get('action_link'):
        return properties.get('action_link')
    return None


def _generate_magic_link(email, redirect_url=None, link_type='invite'):
    headers = _get_supabase_admin_headers()
    if not headers or not SUPABASE_URL:
        return None, 'Supabase admin key is missing.'
    payload = {
        'type': link_type,
        'email': email,
    }
    if redirect_url:
        payload['redirect_to'] = redirect_url
    base = SUPABASE_URL.rstrip('/')
    urls = [
        f'{base}/auth/v1/admin/generate_link',
        f'{base}/auth/v1/generate_link',
    ]
    response = None
    for url in urls:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=10,
        )
        if response.status_code != 404:
            break
    if not response:
        return None, 'Generate link request failed.'
    if response.status_code >= 300:
        try:
            return None, response.json()
        except Exception:
            return None, response.text
    data = response.json() if response.content else {}
    return _extract_action_link(data), None


def _generate_temp_password():
    return f"Lumora-{secrets.token_urlsafe(9)}"


def _create_or_update_user_password(email, full_name=None):
    headers = _get_supabase_admin_headers()
    if not headers or not SUPABASE_URL:
        return None, None, 'Supabase admin key is missing.'
    base = SUPABASE_URL.rstrip('/')
    existing_id = _get_user_id_by_email(email)
    temp_password = _generate_temp_password()
    payload = {
        'password': temp_password,
        'email_confirm': True,
    }
    if full_name:
        payload['user_metadata'] = {'full_name': full_name}
    try:
        if existing_id:
            url = f'{base}/auth/v1/admin/users/{existing_id}'
            response = requests.put(url, headers=headers, json=payload, timeout=10)
        else:
            payload['email'] = email
            url = f'{base}/auth/v1/admin/users'
            response = requests.post(url, headers=headers, json=payload, timeout=10)
        if response.status_code >= 300:
            try:
                return None, None, response.json()
            except Exception:
                return None, None, response.text
        data = response.json() if response.content else {}
        user_id = data.get('id') or data.get('user', {}).get('id') or existing_id
        return user_id, temp_password, None
    except Exception as exc:
        return None, None, str(exc)


def _get_user_id_by_email(email):
    headers = _get_supabase_admin_headers()
    if not headers or not SUPABASE_URL:
        return None
    try:
        response = requests.get(
            SUPABASE_URL.rstrip('/') + '/auth/v1/admin/users',
            headers=headers,
            params={'per_page': 1000},
            timeout=10,
        )
        if response.status_code != 200:
            return None
        data = response.json()
        users = data.get('users') if isinstance(data, dict) else data
        if isinstance(users, list) and users:
            target = (email or '').strip().lower()
            for user in users:
                if (user.get('email') or '').strip().lower() == target:
                    return user.get('id')
    except Exception:
        return None
    return None


def _generate_soulmate_image_bytes(prompt: str):
    if not OPENAI_API_KEY:
        return None, 'OPENAI_API_KEY missing.'
    payload = {
        'model': OPENAI_IMAGE_MODEL,
        'prompt': prompt,
        'size': OPENAI_IMAGE_SIZE,
        'output_format': 'png',
    }
    try:
        response = requests.post(
            'https://api.openai.com/v1/images/generations',
            headers={
                'Authorization': f'Bearer {OPENAI_API_KEY}',
                'Content-Type': 'application/json',
            },
            json=payload,
            timeout=60,
        )
        if response.status_code >= 300:
            return None, response.text
        data = response.json() if response.content else {}
        image_data = (data.get('data') or [{}])[0]
        b64 = image_data.get('b64_json')
        if not b64:
            return None, 'No image data returned.'
        return base64.b64decode(b64), None
    except Exception as exc:
        return None, str(exc)


def _log_generation(message: str):
    print(f"[soulmate] {message}", flush=True)


def _write_text_file(path: str, text: str):
    if text is None:
        return
    try:
        with open(path, 'w', encoding='utf-8') as handle:
            handle.write(text)
    except Exception:
        pass


def _write_json_file(path: str, payload):
    if payload is None:
        return
    try:
        with open(path, 'w', encoding='utf-8') as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
    except Exception:
        pass


def _generate_and_store_soulmate(key: str, prompt: Optional[str] = None, quiz_context: Optional[str] = None, quiz_raw=None):
    try:
        _log_generation(f"start key={key}")
        prompt_text = prompt
        if quiz_raw is not None:
            _write_json_file(os.path.join(SOULMATE_IMAGE_DIR, f"{key}.quiz.json"), quiz_raw)
        if not prompt_text and quiz_context:
            _log_generation(f"prompt_generation_start key={key}")
            prompt_text, _error = _generate_soulmate_prompt(quiz_context)
            if _error:
                _log_generation(f"prompt_generation_error key={key} error={_error}")
            else:
                _log_generation(f"prompt_generation_done key={key}")
        if not prompt_text:
            prompt_text = SOULMATE_IMAGE_PROMPT
        _write_text_file(os.path.join(SOULMATE_IMAGE_DIR, f"{key}.prompt.txt"), prompt_text)
        _log_generation(f"image_generation_start key={key}")
        image_bytes, _error = _generate_soulmate_image_bytes(prompt_text)
        if _error:
            _log_generation(f"image_generation_error key={key} error={_error}")
        if image_bytes:
            _ensure_soulmate_dir()
            path = os.path.join(SOULMATE_IMAGE_DIR, f"{key}.png")
            with open(path, 'wb') as handle:
                handle.write(image_bytes)
            _log_generation(f"image_saved key={key} path={path}")
    finally:
        lock_path = _soulmate_lock_path(key)
        if os.path.exists(lock_path):
            try:
                os.remove(lock_path)
            except Exception:
                pass
        _log_generation(f"done key={key}")


def _queue_soulmate_generation(user_id, email, prompt=None, quiz=None):
    key = user_id or _safe_email_key(email)
    if not key:
        return False
    quiz_context = _format_quiz_context(quiz)
    _ensure_soulmate_dir()
    image_path = os.path.join(SOULMATE_IMAGE_DIR, f"{key}.png")
    if os.path.exists(image_path):
        return True
    lock_path = _soulmate_lock_path(key)
    if os.path.exists(lock_path):
        return True
    try:
        with open(lock_path, 'w', encoding='utf-8') as handle:
            handle.write(str(time.time()))
    except Exception:
        pass
    thread = threading.Thread(
        target=_generate_and_store_soulmate,
        args=(key, prompt, quiz_context or None, quiz),
        daemon=True,
    )
    thread.start()
    return True

app = Flask(__name__)
CORS(app)  # Разрешаем CORS для фронтенда

@app.before_request
def require_auth():
    if is_auth_allowed(request.path):
        return None
    if is_authenticated(request):
        return None
    if request.path.startswith('/api/'):
        return jsonify({"status": "unauthorized"}), 401
    return redirect('/auth', code=302)


@app.route('/', methods=['GET'])
def serve_tarot_index():
    """Главная страница Таро"""
    if not is_authenticated(request):
        return send_from_directory(ROOT_DIR, 'auth.html')
    return send_from_directory(ROOT_DIR, 'index.html')


@app.route('/styles.css', methods=['GET'])
def serve_tarot_styles():
    return send_from_directory(ROOT_DIR, 'styles.css')

@app.route('/magic-layer.css', methods=['GET'])
def serve_magic_layer_styles():
    return send_from_directory(ROOT_DIR, 'magic-layer.css')


@app.route('/app.js', methods=['GET'])
def serve_tarot_app():
    return send_from_directory(ROOT_DIR, 'app.js')

@app.route('/config.js', methods=['GET'])
def serve_config_js():
    return send_from_directory(ROOT_DIR, 'config.js')

@app.route('/auth.js', methods=['GET'])
def serve_auth_js():
    return send_from_directory(ROOT_DIR, 'auth.js')

@app.route('/data/<path:path>', methods=['GET'])
def serve_tarot_data(path):
    return send_from_directory(DATA_DIR, path)


@app.route('/assets/<path:path>', methods=['GET'])
def serve_tarot_assets(path):
    return send_from_directory(ASSETS_DIR, path)

@app.route('/auth', methods=['GET'])
@app.route('/auth/', methods=['GET'])
def serve_auth_page():
    return send_from_directory(ROOT_DIR, 'auth.html')


@app.route('/forget-password', methods=['GET'])
@app.route('/forget-password/', methods=['GET'])
def serve_forgot_password_page():
    return send_from_directory(ROOT_DIR, 'auth.html')


@app.route('/reset-password/<path:token>', methods=['GET'])
def serve_reset_password_page(token):
    return send_from_directory(ROOT_DIR, 'auth.html')


@app.route('/numerology', methods=['GET'])
@app.route('/numerology/', methods=['GET'])
def redirect_numerology_anchor():
    return redirect('/#numerology', code=302)


@app.route('/numerology_static/', methods=['GET'])
def redirect_legacy_numerology_root():
    return redirect('/#numerology', code=302)


@app.route('/numerology_static/<path:path>', methods=['GET'])
def serve_numerology_assets(path):
    return send_from_directory(NUMEROLOGY_DIR, path)


@app.route('/palmistry', methods=['GET'])
@app.route('/palmistry/', methods=['GET'])
def redirect_palmistry_anchor():
    return redirect('/#palmistry', code=302)


@app.route('/palmistry_static/', methods=['GET'])
def redirect_legacy_palmistry_root():
    return redirect('/#palmistry', code=302)


@app.route('/palmistry_static/<path:path>', methods=['GET'])
def serve_palmistry_assets(path):
    return send_from_directory(PALMISTRY_DIR, path)

@app.route('/auth/callback', methods=['GET'])
@app.route('/auth/callback/', methods=['GET'])
def auth_callback():
    """Supabase magic-link callback."""
    return send_from_directory(ROOT_DIR, 'auth.html')


@app.route('/api/session', methods=['POST'])
def create_session():
    data = request.get_json(silent=True) or {}
    token = data.get('access_token', '')
    if not verify_access_token(token):
        return jsonify({"status": "error", "message": "Invalid token"}), 401
    response = make_response(jsonify({"status": "ok"}))
    response.set_cookie(
        'sb_access',
        token,
        httponly=True,
        secure=request.is_secure,
        samesite='Lax',
        max_age=60 * 60 * 24 * 7,
    )
    return response


@app.route('/api/logout', methods=['POST'])
def logout():
    response = make_response(jsonify({"status": "ok"}))
    response.delete_cookie('sb_access')
    return response


@app.route('/api/grant-access', methods=['POST'])
def grant_access():
    if ADMIN_TOKEN:
        token = request.headers.get('X-Admin-Token', '')
        if token != ADMIN_TOKEN:
            return jsonify({"status": "error", "message": "Unauthorized"}), 403
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    full_name = (data.get('full_name') or '').strip()
    prompt = (data.get('prompt') or '').strip()
    quiz = data.get('quiz') or data.get('answers')
    redirect_url = data.get('redirect_url') or _get_default_redirect_url()
    if not email:
        return jsonify({"status": "error", "message": "Email is required"}), 400
    user_id = None
    action_link = None
    dev_password = None
    if DEV_MAGIC_LINK:
        user_id, dev_password, error = _create_or_update_user_password(email, full_name or None)
        if error:
            return jsonify({"status": "error", "message": "Generate login failed", "details": error}), 500
    else:
        user_id, error = _invite_user(email, full_name or None, redirect_url)
        if error:
            existing_id = _get_user_id_by_email(email)
            if existing_id:
                user_id = existing_id
            else:
                return jsonify({"status": "error", "message": "Invite failed", "details": error}), 500
    queued = _queue_soulmate_generation(user_id, email, prompt or None, quiz)
    return jsonify({
        "status": "ok",
        "user_id": user_id,
        "image": "queued" if queued else "skipped",
        "action_link": action_link,
        "dev_password": dev_password,
        "dev_email": email if dev_password else None,
    })


@app.route('/api/soulmate', methods=['GET'])
def soulmate_status():
    user = _get_authenticated_user()
    if not user:
        return jsonify({"status": "unauthorized"}), 401
    user_id = user.get('id')
    email = user.get('email')
    image_path = _find_soulmate_image(user_id, email)
    if image_path:
        return jsonify({"status": "ready", "image_url": "/api/soulmate-image"})
    if _is_soulmate_processing(user_id, email):
        return jsonify({"status": "processing"})
    return jsonify({"status": "missing"})


@app.route('/api/soulmate-image', methods=['GET'])
def soulmate_image():
    user = _get_authenticated_user()
    if not user:
        return jsonify({"status": "unauthorized"}), 401
    user_id = user.get('id')
    email = user.get('email')
    image_path = _find_soulmate_image(user_id, email)
    if not image_path:
        return jsonify({"status": "not_found"}), 404
    return send_from_directory(SOULMATE_IMAGE_DIR, os.path.basename(image_path))


@app.route('/api/soulmate/generate', methods=['POST'])
def soulmate_generate():
    user = _get_authenticated_user()
    if not user:
        return jsonify({"status": "unauthorized"}), 401
    data = request.get_json(silent=True) or {}
    prompt = (data.get('prompt') or '').strip()
    quiz = data.get('quiz') or data.get('answers')
    queued = _queue_soulmate_generation(user.get('id'), user.get('email'), prompt or None, quiz)
    return jsonify({"status": "queued" if queued else "skipped"})


@app.route('/api/health', methods=['GET'])
def health():
    """Проверка здоровья API"""
    return jsonify({
        "status": "ok",
        "message": "Numerology API is running",
        "version": "1.0.0"
    })


@app.route('/api/calculate', methods=['POST'])
def calculate_profile():
    """
    Рассчитывает полный нумерологический профиль.
    
    Body (JSON):
    {
        "full_name": "John Smith",
        "birth_date": "1990-03-15",  # YYYY-MM-DD
        "current_date": "2024-01-15"  # опционально, по умолчанию сегодня
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Валидация входных данных
        full_name = data.get('full_name', '').strip()
        birth_date_str = data.get('birth_date', '')
        
        if not full_name:
            return jsonify({"error": "full_name is required"}), 400
        
        if not birth_date_str:
            return jsonify({"error": "birth_date is required"}), 400
        
        # Парсинг дат
        try:
            birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Invalid birth_date format. Use YYYY-MM-DD"}), 400
        
        current_date = date.today()
        if 'current_date' in data:
            try:
                current_date = datetime.strptime(data['current_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Invalid current_date format. Use YYYY-MM-DD"}), 400
        
        today = date.today()
        if birth_date > today:
            return jsonify({"error": "birth_date cannot be in the future"}), 400
        if current_date > today:
            return jsonify({"error": "current_date cannot be in the future"}), 400
        if current_date < birth_date:
            return jsonify({"error": "current_date cannot be earlier than birth_date"}), 400

        # Рассчитываем профиль
        profile = NumerologyCalculator.calculate_full_profile(
            full_name, birth_date, current_date
        )
        
        # Рассчитываем формулы для отображения
        formulas = calculate_formulas(full_name, birth_date, current_date)
        
        # Формируем ответ
        response = {
            "profile": {
                "life_path": {
                    "number": profile.life_path,
                    "is_master": profile.life_path in [11, 22, 33],
                    "meaning": NUMBER_MEANINGS.get(profile.life_path, {}),
                    "formula": formulas["life_path"]
                },
                "destiny": {
                    "number": profile.destiny,
                    "is_master": profile.destiny in [11, 22, 33],
                    "meaning": NUMBER_MEANINGS.get(profile.destiny, {}),
                    "formula": formulas["destiny"]
                },
                "soul": {
                    "number": profile.soul,
                    "is_master": profile.soul in [11, 22, 33],
                    "meaning": NUMBER_MEANINGS.get(profile.soul, {}),
                    "formula": formulas["soul"]
                },
                "personality": {
                    "number": profile.personality,
                    "is_master": profile.personality in [11, 22, 33],
                    "meaning": NUMBER_MEANINGS.get(profile.personality, {}),
                    "formula": formulas["personality"]
                }
            },
            "pinnacles": profile.pinnacles,
            "challenges": profile.challenges,
            "personal_cycles": {
                "year": {
                    "number": profile.personal_year,
                    "is_master": profile.personal_year in [11, 22, 33],
                    "meaning": NUMBER_MEANINGS.get(profile.personal_year, {}),
                    "formula": formulas["personal_year"]
                },
                "month": {
                    "number": profile.personal_month,
                    "is_master": profile.personal_month in [11, 22, 33],
                    "meaning": NUMBER_MEANINGS.get(profile.personal_month, {}),
                    "formula": formulas["personal_month"]
                },
                "day": {
                    "number": profile.personal_day,
                    "is_master": profile.personal_day in [11, 22, 33],
                    "meaning": NUMBER_MEANINGS.get(profile.personal_day, {}),
                    "formula": formulas["personal_day"]
                }
            },
            "life_path_periods": profile.life_path_periods
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/numbers/<int:number>', methods=['GET'])
def get_number_meaning(number):
    """Получить значение конкретного числа"""
    if number < 1 or number > 33:
        return jsonify({"error": "Number must be between 1 and 33"}), 400
    
    meaning = NUMBER_MEANINGS.get(number, {
        "name": f"Number {number}",
        "keywords": [],
        "description": f"Description for number {number}"
    })
    
    return jsonify({
        "number": number,
        "is_master": number in [11, 22, 33],
        **meaning
    })


@app.route('/api/calculate/life-path', methods=['POST'])
def calculate_life_path():
    """Рассчитать только Life Path Number"""
    try:
        data = request.get_json()
        birth_date_str = data.get('birth_date', '')
        
        if not birth_date_str:
            return jsonify({"error": "birth_date is required"}), 400
        
        birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d').date()
        if birth_date > date.today():
            return jsonify({"error": "birth_date cannot be in the future"}), 400
        life_path = NumerologyCalculator.calculate_life_path(birth_date)
        
        return jsonify({
            "life_path": life_path,
            "is_master": life_path in [11, 22, 33],
            "meaning": NUMBER_MEANINGS.get(life_path, {})
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/calculate/destiny', methods=['POST'])
def calculate_destiny():
    """Рассчитать только Destiny Number"""
    try:
        data = request.get_json()
        full_name = data.get('full_name', '').strip()
        
        if not full_name:
            return jsonify({"error": "full_name is required"}), 400
        
        destiny = NumerologyCalculator.calculate_destiny(full_name)
        
        return jsonify({
            "destiny": destiny,
            "is_master": destiny in [11, 22, 33],
            "meaning": NUMBER_MEANINGS.get(destiny, {})
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/calculate/personal-year', methods=['POST'])
def calculate_personal_year():
    """Рассчитать Personal Year"""
    try:
        data = request.get_json()
        birth_date_str = data.get('birth_date', '')
        current_date_str = data.get('current_date', '')
        
        if not birth_date_str:
            return jsonify({"error": "birth_date is required"}), 400
        
        birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d').date()
        current_date = datetime.strptime(current_date_str, '%Y-%m-%d').date() if current_date_str else date.today()
        today = date.today()
        if birth_date > today:
            return jsonify({"error": "birth_date cannot be in the future"}), 400
        if current_date > today:
            return jsonify({"error": "current_date cannot be in the future"}), 400
        if current_date < birth_date:
            return jsonify({"error": "current_date cannot be earlier than birth_date"}), 400
        
        personal_year = NumerologyCalculator.calculate_personal_year(birth_date, current_date)
        
        return jsonify({
            "personal_year": personal_year,
            "is_master": personal_year in [11, 22, 33],
            "meaning": NUMBER_MEANINGS.get(personal_year, {})
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/compatibility', methods=['POST'])
def calculate_compatibility():
    """
    Рассчитывает совместимость между двумя людьми.
    
    Body (JSON):
    {
        "person1": {
            "full_name": "Иван Иванов",
            "birth_date": "1990-03-15"
        },
        "person2": {
            "full_name": "Мария Петрова",
            "birth_date": "1992-07-20"
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'person1' not in data or 'person2' not in data:
            return jsonify({"error": "person1 and person2 are required"}), 400
        
        # Парсим данные первого человека
        p1_data = data['person1']
        p1_name = p1_data.get('full_name', '').strip()
        p1_birth_str = p1_data.get('birth_date', '')
        
        if not p1_name or not p1_birth_str:
            return jsonify({"error": "person1: full_name and birth_date are required"}), 400
        
        p1_birth = datetime.strptime(p1_birth_str, '%Y-%m-%d').date()
        if p1_birth > date.today():
            return jsonify({"error": "person1 birth_date cannot be in the future"}), 400
        
        # Парсим данные второго человека
        p2_data = data['person2']
        p2_name = p2_data.get('full_name', '').strip()
        p2_birth_str = p2_data.get('birth_date', '')
        
        if not p2_name or not p2_birth_str:
            return jsonify({"error": "person2: full_name and birth_date are required"}), 400
        
        p2_birth = datetime.strptime(p2_birth_str, '%Y-%m-%d').date()
        if p2_birth > date.today():
            return jsonify({"error": "person2 birth_date cannot be in the future"}), 400
        
        # Рассчитываем профили
        profile1 = NumerologyCalculator.calculate_full_profile(p1_name, p1_birth)
        profile2 = NumerologyCalculator.calculate_full_profile(p2_name, p2_birth)
        
        # Рассчитываем совместимость
        compatibility = CompatibilityCalculator.calculate_pair_compatibility(profile1, profile2)
        
        # Формируем ответ
        response = {
            "overall_score": compatibility.overall_score,
            "description": compatibility.description,
            "pair_number": compatibility.pair_number,
            "compatibilities": {
                "life_path": compatibility.life_path_compatibility,
                "destiny": compatibility.destiny_compatibility,
                "soul": compatibility.soul_compatibility,
                "personality": compatibility.personality_compatibility
            },
            "recommendations": compatibility.recommendations,
            "person1": {
                "name": p1_name,
                "life_path": profile1.life_path,
                "destiny": profile1.destiny,
                "soul": profile1.soul,
                "personality": profile1.personality
            },
            "person2": {
                "name": p2_name,
                "life_path": profile2.life_path,
                "destiny": profile2.destiny,
                "soul": profile2.soul,
                "personality": profile2.personality
            }
        }
        
        return jsonify(response)
    
    except ValueError as e:
        return jsonify({"error": f"Invalid date format: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("=" * 60)
    print("Приложение Таро + Нумерология запущено!")
    print("=" * 60)
    print("Таро: http://localhost:5002/")
    print("Нумерология: http://localhost:5002/#numerology")
    print("Хиромантия: http://localhost:5002/#palmistry")
    print("API: http://localhost:5002/api/health")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5002, debug=True)
