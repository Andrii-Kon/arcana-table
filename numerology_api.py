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

_jwks_client = None
_jwks_client_set_at = 0


def _get_jwks_client() -> PyJWKClient | None:
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
    return False

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
