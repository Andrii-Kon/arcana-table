#!/usr/bin/env python3
"""
Система нумерологических расчетов.
Реализует все основные расчеты нумерологии на основе книги Jean Simpson.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime, date


# Таблица соответствия букв и чисел (Pythagorean система)
# Латинские буквы
LETTER_TO_NUMBER = {
    'A': 1, 'J': 1, 'S': 1,
    'B': 2, 'K': 2, 'T': 2,
    'C': 3, 'L': 3, 'U': 3,
    'D': 4, 'M': 4, 'V': 4,
    'E': 5, 'N': 5, 'W': 5,
    'F': 6, 'O': 6, 'X': 6,
    'G': 7, 'P': 7, 'Y': 7,
    'H': 8, 'Q': 8, 'Z': 8,
    'I': 9, 'R': 9
}

# Кириллические буквы (соответствие по звучанию и позиции)
CYRILLIC_TO_NUMBER = {
    # 1: А, И, С, Ъ
    'А': 1, 'И': 1, 'С': 1, 'Ъ': 1,
    # 2: Б, Й, Т, Ы
    'Б': 2, 'Й': 2, 'Т': 2, 'Ы': 2,
    # 3: В, К, У, Ь
    'В': 3, 'К': 3, 'У': 3, 'Ь': 3,
    # 4: Г, Л, Ф, Э
    'Г': 4, 'Л': 4, 'Ф': 4, 'Э': 4,
    # 5: Д, М, Х, Ю
    'Д': 5, 'М': 5, 'Х': 5, 'Ю': 5,
    # 6: Е, Н, Ц, Я
    'Е': 6, 'Н': 6, 'Ц': 6, 'Я': 6,
    # 7: Ё, О, Ч
    'Ё': 7, 'О': 7, 'Ч': 7,
    # 8: Ж, П, Ш
    'Ж': 8, 'П': 8, 'Ш': 8,
    # 9: З, Р, Щ
    'З': 9, 'Р': 9, 'Щ': 9
}

# Объединяем обе таблицы
LETTER_TO_NUMBER.update(CYRILLIC_TO_NUMBER)

# Гласные буквы для расчета Soul Number (латиница и кириллица)
VOWELS = {'A', 'E', 'I', 'O', 'U', 'Y', 'А', 'Е', 'Ё', 'И', 'О', 'У', 'Ы', 'Э', 'Ю', 'Я'}

# Мастер-числа (не редуцируются)
MASTER_NUMBERS = {11, 22, 33}


@dataclass
class NumerologyProfile:
    """Полный нумерологический профиль человека"""
    # Основные числа
    life_path: int
    destiny: int
    soul: int
    personality: int
    
    # Пики (4 периода)
    pinnacles: List[Dict[str, any]]
    
    # Вызовы (4 периода)
    challenges: List[Dict[str, any]]
    
    # Персональные циклы
    personal_year: int
    personal_month: int
    personal_day: int
    
    # Дополнительная информация
    life_path_periods: Dict[str, int]  # Возрастные периоды для пиков/вызовов


class NumerologyCalculator:
    """Калькулятор нумерологических чисел"""
    
    @staticmethod
    def letter_to_number(letter: str) -> int:
        """
        Преобразует букву в число по Pythagorean системе.
        Поддерживает латиницу и кириллицу.
        """
        letter = letter.upper()
        # Пробуем найти в таблице (поддерживает и латиницу, и кириллицу)
        number = LETTER_TO_NUMBER.get(letter, 0)
        
        # Если не найдено, возможно это специальный символ
        # Для кириллицы некоторые буквы могут отсутствовать, используем транслитерацию
        if number == 0 and letter.isalpha():
            # Транслитерация для отсутствующих букв
            translit_map = {
                'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
                'Е': 'E', 'Ё': 'E', 'Ж': 'ZH', 'З': 'Z', 'И': 'I',
                'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
                'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
                'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'TS', 'Ч': 'CH',
                'Ш': 'SH', 'Щ': 'SCH', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
                'Э': 'E', 'Ю': 'YU', 'Я': 'YA'
            }
            # Если есть транслитерация, берем первую букву
            if letter in translit_map:
                translit = translit_map[letter]
                if translit:
                    first_char = translit[0].upper()
                    number = LETTER_TO_NUMBER.get(first_char, 0)
        
        return number
    
    @staticmethod
    def reduce_to_single_digit(number: int, allow_master: bool = True) -> int:
        """
        Редуцирует число до одной цифры.
        
        Args:
            number: Число для редуцирования
            allow_master: Разрешить мастер-числа (11, 22, 33)
        
        Returns:
            Редуцированное число или мастер-число
        """
        if number <= 9:
            return number
        
        # Проверяем мастер-числа
        if allow_master and number in MASTER_NUMBERS:
            return number
        
        # Редуцируем
        while number > 9:
            digits = [int(d) for d in str(number)]
            number = sum(digits)
            
            # Проверяем мастер-числа после редуцирования
            if allow_master and number in MASTER_NUMBERS:
                return number
        
        return number
    
    @staticmethod
    def calculate_life_path(birth_date: date) -> int:
        """
        Рассчитывает Life Path Number из даты рождения.
        
        Формула: Сумма всех цифр даты рождения → редуцирование
        """
        day = birth_date.day
        month = birth_date.month
        year = birth_date.year
        
        # Суммируем все цифры
        total = 0
        for digit in str(day):
            total += int(digit)
        for digit in str(month):
            total += int(digit)
        for digit in str(year):
            total += int(digit)
        
        return NumerologyCalculator.reduce_to_single_digit(total, allow_master=True)
    
    @staticmethod
    def calculate_destiny(full_name: str) -> int:
        """
        Рассчитывает Destiny Number из полного имени.
        
        Формула: Сумма всех букв имени → редуцирование
        """
        total = 0
        for char in full_name:
            if char.isalpha():
                total += NumerologyCalculator.letter_to_number(char)
        
        return NumerologyCalculator.reduce_to_single_digit(total, allow_master=True)
    
    @staticmethod
    def calculate_soul(full_name: str) -> int:
        """
        Рассчитывает Soul Number из гласных имени.
        
        Формула: Сумма только гласных → редуцирование
        """
        total = 0
        for char in full_name:
            if char.upper() in VOWELS:
                total += NumerologyCalculator.letter_to_number(char)
        
        return NumerologyCalculator.reduce_to_single_digit(total, allow_master=True)
    
    @staticmethod
    def calculate_personality(full_name: str) -> int:
        """
        Рассчитывает Personality Number из согласных имени.
        
        Формула: Сумма только согласных → редуцирование
        """
        total = 0
        for char in full_name:
            if char.isalpha() and char.upper() not in VOWELS:
                total += NumerologyCalculator.letter_to_number(char)
        
        return NumerologyCalculator.reduce_to_single_digit(total, allow_master=True)
    
    @staticmethod
    def calculate_pinnacles(birth_date: date, life_path: int) -> List[Dict[str, any]]:
        """
        Рассчитывает 4 пика жизни.
        
        Первый пик: Месяц + День
        Второй пик: День + Год
        Третий пик: Первый пик + Второй пик
        Четвертый пик: Месяц + Год
        """
        day = birth_date.day
        month = birth_date.month
        year_digits = [int(d) for d in str(birth_date.year)]
        year_sum = sum(year_digits)
        
        # Редуцируем компоненты
        month_reduced = NumerologyCalculator.reduce_to_single_digit(month, allow_master=False)
        day_reduced = NumerologyCalculator.reduce_to_single_digit(day, allow_master=False)
        year_reduced = NumerologyCalculator.reduce_to_single_digit(year_sum, allow_master=False)
        
        # Рассчитываем пики
        pinnacle1 = NumerologyCalculator.reduce_to_single_digit(
            month_reduced + day_reduced, allow_master=True
        )
        pinnacle2 = NumerologyCalculator.reduce_to_single_digit(
            day_reduced + year_reduced, allow_master=True
        )
        pinnacle3 = NumerologyCalculator.reduce_to_single_digit(
            pinnacle1 + pinnacle2, allow_master=True
        )
        pinnacle4 = NumerologyCalculator.reduce_to_single_digit(
            month_reduced + year_reduced, allow_master=True
        )
        
        # Определяем возрастные периоды на основе Life Path
        periods = NumerologyCalculator._get_life_path_periods(life_path)
        
        return [
            {
                "number": pinnacle1,
                "age_start": periods["pinnacle1_start"],
                "age_end": periods["pinnacle1_end"],
                "description": NumerologyCalculator._get_pinnacle_description(pinnacle1)
            },
            {
                "number": pinnacle2,
                "age_start": periods["pinnacle2_start"],
                "age_end": periods["pinnacle2_end"],
                "description": NumerologyCalculator._get_pinnacle_description(pinnacle2)
            },
            {
                "number": pinnacle3,
                "age_start": periods["pinnacle3_start"],
                "age_end": periods["pinnacle3_end"],
                "description": NumerologyCalculator._get_pinnacle_description(pinnacle3)
            },
            {
                "number": pinnacle4,
                "age_start": periods["pinnacle4_start"],
                "age_end": None,  # До конца жизни
                "description": NumerologyCalculator._get_pinnacle_description(pinnacle4)
            }
        ]
    
    @staticmethod
    def calculate_challenges(birth_date: date, life_path: int) -> List[Dict[str, any]]:
        """
        Рассчитывает 4 вызова жизни.
        
        Первый вызов: |Месяц - День|
        Второй вызов: |День - Год|
        Третий вызов: |Первый вызов - Второй вызов|
        Четвертый вызов: |Месяц - Год|
        """
        day = birth_date.day
        month = birth_date.month
        year_digits = [int(d) for d in str(birth_date.year)]
        year_sum = sum(year_digits)
        
        # Редуцируем компоненты
        month_reduced = NumerologyCalculator.reduce_to_single_digit(month, allow_master=False)
        day_reduced = NumerologyCalculator.reduce_to_single_digit(day, allow_master=False)
        year_reduced = NumerologyCalculator.reduce_to_single_digit(year_sum, allow_master=False)
        
        # Рассчитываем вызовы (абсолютное значение разности)
        challenge1 = abs(month_reduced - day_reduced)
        challenge2 = abs(day_reduced - year_reduced)
        challenge3 = abs(challenge1 - challenge2)
        challenge4 = abs(month_reduced - year_reduced)
        
        # Определяем возрастные периоды
        periods = NumerologyCalculator._get_life_path_periods(life_path)
        
        return [
            {
                "number": challenge1 if challenge1 > 0 else 0,
                "age_start": periods["pinnacle1_start"],
                "age_end": periods["pinnacle1_end"],
                "description": NumerologyCalculator._get_challenge_description(challenge1)
            },
            {
                "number": challenge2 if challenge2 > 0 else 0,
                "age_start": periods["pinnacle2_start"],
                "age_end": periods["pinnacle2_end"],
                "description": NumerologyCalculator._get_challenge_description(challenge2)
            },
            {
                "number": challenge3 if challenge3 > 0 else 0,
                "age_start": periods["pinnacle3_start"],
                "age_end": periods["pinnacle3_end"],
                "description": NumerologyCalculator._get_challenge_description(challenge3)
            },
            {
                "number": challenge4 if challenge4 > 0 else 0,
                "age_start": periods["pinnacle4_start"],
                "age_end": None,
                "description": NumerologyCalculator._get_challenge_description(challenge4)
            }
        ]
    
    @staticmethod
    def calculate_personal_year(birth_date: date, current_date: date) -> int:
        """
        Рассчитывает Personal Year.
        
        Формула: Месяц рождения + День рождения + Текущий год → редуцирование
        """
        month = birth_date.month
        day = birth_date.day
        current_year = current_date.year
        
        total = 0
        for digit in str(month):
            total += int(digit)
        for digit in str(day):
            total += int(digit)
        for digit in str(current_year):
            total += int(digit)
        
        return NumerologyCalculator.reduce_to_single_digit(total, allow_master=True)
    
    @staticmethod
    def calculate_personal_month(birth_date: date, current_date: date) -> int:
        """
        Рассчитывает Personal Month.
        
        Формула: Personal Year + Номер месяца → редуцирование
        """
        personal_year = NumerologyCalculator.calculate_personal_year(birth_date, current_date)
        month = current_date.month
        
        return NumerologyCalculator.reduce_to_single_digit(
            personal_year + month, allow_master=True
        )
    
    @staticmethod
    def calculate_personal_day(birth_date: date, current_date: date) -> int:
        """
        Рассчитывает Personal Day.
        
        Формула: Personal Month + День месяца → редуцирование
        """
        personal_month = NumerologyCalculator.calculate_personal_month(birth_date, current_date)
        day = current_date.day
        
        day_sum = sum(int(d) for d in str(day))
        return NumerologyCalculator.reduce_to_single_digit(
            personal_month + day_sum, allow_master=True
        )
    
    @staticmethod
    def _get_life_path_periods(life_path: int) -> Dict[str, int]:
        """Возвращает возрастные периоды для пиков и вызовов на основе Life Path"""
        # Базовая формула: периоды зависят от Life Path Number
        base_periods = {
            1: {"p1": 35, "p2": 44, "p3": 53},
            2: {"p1": 34, "p2": 43, "p3": 52},
            3: {"p1": 33, "p2": 42, "p3": 51},
            4: {"p1": 32, "p2": 41, "p3": 50},
            5: {"p1": 31, "p2": 40, "p3": 49},
            6: {"p1": 30, "p2": 39, "p3": 48},
            7: {"p1": 29, "p2": 38, "p3": 47},
            8: {"p1": 28, "p2": 37, "p3": 46},
            9: {"p1": 27, "p2": 36, "p3": 45},
        }
        
        periods = base_periods.get(life_path, base_periods[1])
        
        return {
            "pinnacle1_start": 0,
            "pinnacle1_end": periods["p1"],
            "pinnacle2_start": periods["p1"],
            "pinnacle2_end": periods["p2"],
            "pinnacle3_start": periods["p2"],
            "pinnacle3_end": periods["p3"],
            "pinnacle4_start": periods["p3"],
            "pinnacle4_end": None
        }
    
    @staticmethod
    def _get_pinnacle_description(number: int) -> str:
        """Возвращает описание пика по числу"""
        descriptions = {
            1: "A surge of independence and new starts",
            2: "Partnerships and gentle strength grow",
            3: "Creative expression comes to the front",
            4: "Build, organize, and stabilize",
            5: "Change, freedom, and reinvention",
            6: "Care, duty, and home life deepen",
            7: "Reflection, study, and inner trust",
            8: "Ambition, results, and material focus",
            9: "Completion, generosity, and wisdom",
            11: "Intuition rises and vision sharpens",
            22: "Build something lasting and practical",
            33: "Compassion, healing, and teaching"
        }
        return descriptions.get(number, f"A period marked by number {number}")
    
    @staticmethod
    def _get_challenge_description(number: int) -> str:
        """Возвращает описание вызова по числу"""
        descriptions = {
            0: "A lighter stretch with few sharp tests",
            1: "Learn self-reliance and bold action",
            2: "Learn patience, cooperation, and trust",
            3: "Learn focus in expression",
            4: "Learn structure and follow-through",
            5: "Learn freedom with responsibility",
            6: "Learn balance in care and duty",
            7: "Learn solitude, faith, and clarity",
            8: "Learn power, money, and restraint",
            9: "Learn release, forgiveness, and service"
        }
        return descriptions.get(number, f"Challenge shaped by number {number}")
    
    @staticmethod
    def calculate_full_profile(full_name: str, birth_date: date, 
                              current_date: Optional[date] = None) -> NumerologyProfile:
        """
        Рассчитывает полный нумерологический профиль.
        
        Args:
            full_name: Полное имя (например, "John Smith")
            birth_date: Дата рождения
            current_date: Текущая дата (по умолчанию сегодня)
        
        Returns:
            NumerologyProfile с всеми расчетами
        """
        if current_date is None:
            current_date = date.today()
        
        # Основные числа
        life_path = NumerologyCalculator.calculate_life_path(birth_date)
        destiny = NumerologyCalculator.calculate_destiny(full_name)
        soul = NumerologyCalculator.calculate_soul(full_name)
        personality = NumerologyCalculator.calculate_personality(full_name)
        
        # Пики и вызовы
        pinnacles = NumerologyCalculator.calculate_pinnacles(birth_date, life_path)
        challenges = NumerologyCalculator.calculate_challenges(birth_date, life_path)
        
        # Персональные циклы
        personal_year = NumerologyCalculator.calculate_personal_year(birth_date, current_date)
        personal_month = NumerologyCalculator.calculate_personal_month(birth_date, current_date)
        personal_day = NumerologyCalculator.calculate_personal_day(birth_date, current_date)
        
        # Периоды жизни
        life_path_periods = NumerologyCalculator._get_life_path_periods(life_path)
        
        return NumerologyProfile(
            life_path=life_path,
            destiny=destiny,
            soul=soul,
            personality=personality,
            pinnacles=pinnacles,
            challenges=challenges,
            personal_year=personal_year,
            personal_month=personal_month,
            personal_day=personal_day,
            life_path_periods=life_path_periods
        )


# Значения чисел для интерпретации
NUMBER_MEANINGS = {
    1: {
        "name": "Trailblazer",
        "keywords": ["initiative", "independence", "direction", "drive"],
        "description": "A spark of leadership and fresh starts. You move first and set the pace."
    },
    2: {
        "name": "Harmonizer",
        "keywords": ["balance", "partnership", "empathy", "diplomacy"],
        "description": "You build calm strength through cooperation and careful listening."
    },
    3: {
        "name": "Storyteller",
        "keywords": ["expression", "creativity", "joy", "communication"],
        "description": "You light up a room with ideas, play, and voice."
    },
    4: {
        "name": "Builder",
        "keywords": ["structure", "discipline", "stability", "craft"],
        "description": "You create steady foundations and make plans real."
    },
    5: {
        "name": "Explorer",
        "keywords": ["freedom", "change", "adaptability", "curiosity"],
        "description": "You learn through movement, variety, and bold choices."
    },
    6: {
        "name": "Caretaker",
        "keywords": ["care", "responsibility", "home", "service"],
        "description": "You nurture others and create warmth and safety."
    },
    7: {
        "name": "Seeker",
        "keywords": ["insight", "analysis", "intuition", "wisdom"],
        "description": "You look beneath the surface and trust inner guidance."
    },
    8: {
        "name": "Achiever",
        "keywords": ["ambition", "power", "results", "leadership"],
        "description": "You are wired for impact, organization, and material mastery."
    },
    9: {
        "name": "Humanitarian",
        "keywords": ["compassion", "completion", "service", "vision"],
        "description": "You carry a wide heart and finish cycles with wisdom."
    },
    11: {
        "name": "Visionary",
        "keywords": ["intuition", "inspiration", "illumination", "idealism"],
        "description": "Heightened insight and a call to uplift."
    },
    22: {
        "name": "Master Builder",
        "keywords": ["vision", "structure", "execution", "legacy"],
        "description": "You turn big ideas into tangible impact."
    },
    33: {
        "name": "Master Teacher",
        "keywords": ["compassion", "healing", "guidance", "service"],
        "description": "You lead through care and teach by example."
    }
}
