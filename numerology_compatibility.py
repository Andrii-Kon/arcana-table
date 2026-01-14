#!/usr/bin/env python3
"""
Система совместимости в нумерологии.
Определяет совместимость между двумя людьми на основе их нумерологических чисел.
"""

from dataclasses import dataclass
from typing import Dict, List, Tuple
from numerology_system import NumerologyProfile, NumerologyCalculator


@dataclass
class CompatibilityResult:
    """Результат расчета совместимости"""
    # Общая совместимость (0-100%)
    overall_score: int
    
    # Совместимость по каждому числу
    life_path_compatibility: Dict[str, any]
    destiny_compatibility: Dict[str, any]
    soul_compatibility: Dict[str, any]
    personality_compatibility: Dict[str, any]
    
    # Групповое число пары
    pair_number: int
    
    # Описание совместимости
    description: str
    recommendations: List[str]


class CompatibilityCalculator:
    """Калькулятор совместимости"""
    
    # Таблица совместимости Life Path Numbers
    LIFE_PATH_COMPATIBILITY = {
        (1, 1): {"score": 70, "type": "power", "desc": "High voltage: two leaders can clash or forge a strong alliance"},
        (1, 2): {"score": 85, "type": "complementary", "desc": "Spark: leader and diplomat complement each other"},
        (1, 3): {"score": 90, "type": "excellent", "desc": "Spark: creativity and leadership"},
        (1, 4): {"score": 60, "type": "moderate", "desc": "Balanced mix: different approaches to life"},
        (1, 5): {"score": 85, "type": "good", "desc": "Easy flow: both value freedom and change"},
        (1, 6): {"score": 65, "type": "moderate", "desc": "Balanced mix: different priorities"},
        (1, 7): {"score": 50, "type": "challenging", "desc": "Friction: different worldviews"},
        (1, 8): {"score": 90, "type": "excellent", "desc": "Spark: both are ambitious"},
        (1, 9): {"score": 80, "type": "good", "desc": "Easy flow: leader and humanitarian"},
        (2, 2): {"score": 95, "type": "excellent", "desc": "Spark: both are diplomatic"},
        (2, 3): {"score": 85, "type": "good", "desc": "Easy flow: creativity and harmony"},
        (2, 4): {"score": 90, "type": "excellent", "desc": "Spark: stability and partnership"},
        (2, 5): {"score": 55, "type": "challenging", "desc": "Friction: different needs"},
        (2, 6): {"score": 95, "type": "excellent", "desc": "Spark: both are caring"},
        (2, 7): {"score": 80, "type": "good", "desc": "Easy flow: intuition and sensitivity"},
        (2, 8): {"score": 65, "type": "moderate", "desc": "Balanced mix: different values"},
        (2, 9): {"score": 85, "type": "good", "desc": "Easy flow: both are humanitarian"},
        (3, 3): {"score": 95, "type": "excellent", "desc": "Spark: both are creative"},
        (3, 4): {"score": 60, "type": "moderate", "desc": "Balanced mix: creativity vs stability"},
        (3, 5): {"score": 90, "type": "excellent", "desc": "Spark: both enjoy change"},
        (3, 6): {"score": 80, "type": "good", "desc": "Easy flow: creativity and care"},
        (3, 7): {"score": 65, "type": "moderate", "desc": "Balanced mix: different approaches"},
        (3, 8): {"score": 55, "type": "challenging", "desc": "Friction: different priorities"},
        (3, 9): {"score": 90, "type": "excellent", "desc": "Spark: creativity and wisdom"},
        (4, 4): {"score": 95, "type": "excellent", "desc": "Spark: both are practical"},
        (4, 5): {"score": 50, "type": "challenging", "desc": "Friction: stability vs freedom"},
        (4, 6): {"score": 95, "type": "excellent", "desc": "Spark: both are reliable"},
        (4, 7): {"score": 80, "type": "good", "desc": "Easy flow: practicality and wisdom"},
        (4, 8): {"score": 90, "type": "excellent", "desc": "Spark: both are ambitious"},
        (4, 9): {"score": 75, "type": "good", "desc": "Easy flow: practicality and wisdom"},
        (5, 5): {"score": 95, "type": "excellent", "desc": "Spark: both are freedom-loving"},
        (5, 6): {"score": 55, "type": "challenging", "desc": "Friction: freedom vs responsibility"},
        (5, 7): {"score": 65, "type": "moderate", "desc": "Balanced mix: different needs"},
        (5, 8): {"score": 80, "type": "good", "desc": "Easy flow: activity and success"},
        (5, 9): {"score": 80, "type": "good", "desc": "Easy flow: change and wisdom"},
        (6, 6): {"score": 95, "type": "excellent", "desc": "Spark: both are caring"},
        (6, 7): {"score": 85, "type": "good", "desc": "Easy flow: care and wisdom"},
        (6, 8): {"score": 65, "type": "moderate", "desc": "Balanced mix: different values"},
        (6, 9): {"score": 95, "type": "excellent", "desc": "Spark: care and service"},
        (7, 7): {"score": 95, "type": "excellent", "desc": "Spark: both are spiritual"},
        (7, 8): {"score": 50, "type": "challenging", "desc": "Friction: spirituality vs materialism"},
        (7, 9): {"score": 90, "type": "excellent", "desc": "Spark: wisdom and compassion"},
        (8, 8): {"score": 90, "type": "excellent", "desc": "Spark: both are ambitious"},
        (8, 9): {"score": 65, "type": "moderate", "desc": "Balanced mix: different priorities"},
        (9, 9): {"score": 95, "type": "excellent", "desc": "Spark: both are humanitarian"}
    }
    
    @staticmethod
    def _normalize_pair(num1: int, num2: int) -> Tuple[int, int]:
        """Нормализует пару чисел (меньшее первым)"""
        return (min(num1, num2), max(num1, num2))
    
    @staticmethod
    def _get_compatibility_score(num1: int, num2: int, compatibility_table: Dict) -> Dict:
        """Получает оценку совместимости из таблицы"""
        pair = CompatibilityCalculator._normalize_pair(num1, num2)
        
        # Прямое совпадение
        if pair in compatibility_table:
            return compatibility_table[pair]
        
        # Если одно из чисел - мастер-число, пробуем редуцировать
        if num1 in [11, 22, 33]:
            reduced1 = CompatibilityCalculator._reduce_master(num1)
            pair_reduced = CompatibilityCalculator._normalize_pair(reduced1, num2)
            if pair_reduced in compatibility_table:
                result = compatibility_table[pair_reduced].copy()
                result["desc"] += " (master number adds nuance)"
                return result
        
        if num2 in [11, 22, 33]:
            reduced2 = CompatibilityCalculator._reduce_master(num2)
            pair_reduced = CompatibilityCalculator._normalize_pair(num1, reduced2)
            if pair_reduced in compatibility_table:
                result = compatibility_table[pair_reduced].copy()
                result["desc"] += " (master number adds nuance)"
                return result
        
        # Если оба мастер-числа
        if num1 in [11, 22, 33] and num2 in [11, 22, 33]:
            reduced1 = CompatibilityCalculator._reduce_master(num1)
            reduced2 = CompatibilityCalculator._reduce_master(num2)
            pair_reduced = CompatibilityCalculator._normalize_pair(reduced1, reduced2)
            if pair_reduced in compatibility_table:
                result = compatibility_table[pair_reduced].copy()
                result["desc"] += " (both carry master numbers)"
                result["score"] = min(100, result["score"] + 5)  # Бонус за оба мастер-числа
                return result
        
        # Если не найдено, используем разность чисел
        diff = abs(num1 - num2)
        if diff == 0:
            return {"score": 90, "type": "excellent", "desc": "Easy mirror: shared rhythm and understanding"}
        elif diff <= 2:
            return {"score": 75, "type": "good", "desc": "Close tones: easy alignment with small adjustments"}
        elif diff <= 4:
            return {"score": 60, "type": "moderate", "desc": "Mixed blend: workable with attention"}
        else:
            return {"score": 50, "type": "challenging", "desc": "Wide contrast: growth comes through effort"}
    
    @staticmethod
    def _reduce_master(master_num: int) -> int:
        """Редуцирует мастер-число до базового"""
        master_map = {11: 2, 22: 4, 33: 6}
        return master_map.get(master_num, master_num)
    
    @staticmethod
    def calculate_pair_compatibility(profile1: NumerologyProfile, 
                                    profile2: NumerologyProfile) -> CompatibilityResult:
        """
        Рассчитывает совместимость между двумя профилями.
        
        Args:
            profile1: Первый нумерологический профиль
            profile2: Второй нумерологический профиль
        
        Returns:
            CompatibilityResult с оценкой совместимости
        """
        # Совместимость Life Path
        life_path_comp = CompatibilityCalculator._get_compatibility_score(
            profile1.life_path, profile2.life_path, 
            CompatibilityCalculator.LIFE_PATH_COMPATIBILITY
        )
        
        # Совместимость Destiny
        destiny_comp = CompatibilityCalculator._get_compatibility_score(
            profile1.destiny, profile2.destiny,
            CompatibilityCalculator.LIFE_PATH_COMPATIBILITY  # Используем ту же таблицу
        )
        
        # Совместимость Soul
        soul_comp = CompatibilityCalculator._get_compatibility_score(
            profile1.soul, profile2.soul,
            CompatibilityCalculator.LIFE_PATH_COMPATIBILITY
        )
        
        # Совместимость Personality
        personality_comp = CompatibilityCalculator._get_compatibility_score(
            profile1.personality, profile2.personality,
            CompatibilityCalculator.LIFE_PATH_COMPATIBILITY
        )
        
        # Рассчитываем общую оценку (взвешенная сумма)
        weights = {
            "life_path": 0.4,  # Life Path самый важный
            "destiny": 0.3,
            "soul": 0.2,
            "personality": 0.1
        }
        
        overall_score = int(
            life_path_comp["score"] * weights["life_path"] +
            destiny_comp["score"] * weights["destiny"] +
            soul_comp["score"] * weights["soul"] +
            personality_comp["score"] * weights["personality"]
        )
        
        # Групповое число пары (сумма Life Path)
        pair_sum = profile1.life_path + profile2.life_path
        pair_number = NumerologyCalculator.reduce_to_single_digit(pair_sum, allow_master=True)
        
        # Описание и рекомендации
        description = CompatibilityCalculator._generate_description(
            overall_score, life_path_comp, pair_number
        )
        
        recommendations = CompatibilityCalculator._generate_recommendations(
            overall_score, life_path_comp, destiny_comp, soul_comp, personality_comp
        )
        
        return CompatibilityResult(
            overall_score=overall_score,
            life_path_compatibility={
                "score": life_path_comp["score"],
                "type": life_path_comp["type"],
                "description": life_path_comp["desc"],
                "numbers": (profile1.life_path, profile2.life_path)
            },
            destiny_compatibility={
                "score": destiny_comp["score"],
                "type": destiny_comp["type"],
                "description": destiny_comp["desc"],
                "numbers": (profile1.destiny, profile2.destiny)
            },
            soul_compatibility={
                "score": soul_comp["score"],
                "type": soul_comp["type"],
                "description": soul_comp["desc"],
                "numbers": (profile1.soul, profile2.soul)
            },
            personality_compatibility={
                "score": personality_comp["score"],
                "type": personality_comp["type"],
                "description": personality_comp["desc"],
                "numbers": (profile1.personality, profile2.personality)
            },
            pair_number=pair_number,
            description=description,
            recommendations=recommendations
        )
    
    @staticmethod
    def _generate_description(overall_score: int, life_path_comp: Dict, pair_number: int) -> str:
        """Генерирует описание совместимости"""
        if overall_score >= 85:
            return (
                f"Strong match ({overall_score}%). Your numbers echo each other and build momentum. "
                f"Pair number: {pair_number}."
            )
        elif overall_score >= 70:
            return (
                f"Warm match ({overall_score}%). Plenty of harmony with room to grow. "
                f"Pair number: {pair_number}."
            )
        elif overall_score >= 60:
            return (
                f"Mixed match ({overall_score}%). With care and communication, this can work well. "
                f"Pair number: {pair_number}."
            )
        else:
            return (
                f"Growth edge ({overall_score}%). This pairing can be powerful, but it asks for patience and intention. "
                f"Pair number: {pair_number}."
            )
    
    @staticmethod
    def _generate_recommendations(overall_score: int, *compatibilities: Dict) -> List[str]:
        """Генерирует рекомендации на основе совместимости"""
        recommendations = []
        
        if overall_score >= 85:
            recommendations.append("Lean into shared goals and celebrate what comes easily.")
            recommendations.append("Keep communication open; your signals are naturally aligned.")
        elif overall_score >= 70:
            recommendations.append("Name your shared priorities early and return to them often.")
            recommendations.append("Honor differences; they add texture and balance.")
        elif overall_score >= 60:
            recommendations.append("Slow down and listen; small adjustments go a long way.")
            recommendations.append("Set clear expectations to avoid crossed wires.")
        else:
            recommendations.append("Take it step by step; consistency matters more than intensity.")
            recommendations.append("If you choose this path, be deliberate and kind with boundaries.")
        
        # Специфические рекомендации на основе типов совместимости
        challenging_count = sum(1 for c in compatibilities if c.get("type") == "challenging")
        if challenging_count >= 2:
            recommendations.append("Several areas may feel sharp; pace yourselves and build trust.")
        
        excellent_count = sum(1 for c in compatibilities if c.get("type") == "excellent")
        if excellent_count >= 2:
            recommendations.append("You have bright anchors; return to them when things wobble.")
        
        return recommendations
    
    @staticmethod
    def calculate_group_compatibility(profiles: List[NumerologyProfile]) -> Dict:
        """
        Рассчитывает совместимость группы людей.
        
        Args:
            profiles: Список нумерологических профилей
        
        Returns:
            Словарь с информацией о групповой совместимости
        """
        if len(profiles) < 2:
            return {"error": "At least 2 profiles are required"}
        
        # Суммируем все Life Path Numbers
        life_paths = [p.life_path for p in profiles]
        group_life_path_sum = sum(life_paths)
        group_life_path = NumerologyCalculator.reduce_to_single_digit(
            group_life_path_sum, allow_master=True
        )
        
        # Суммируем все Destiny Numbers
        destinies = [p.destiny for p in profiles]
        group_destiny_sum = sum(destinies)
        group_destiny = NumerologyCalculator.reduce_to_single_digit(
            group_destiny_sum, allow_master=True
        )
        
        # Рассчитываем попарную совместимость
        pair_compatibilities = []
        for i in range(len(profiles)):
            for j in range(i + 1, len(profiles)):
                comp = CompatibilityCalculator.calculate_pair_compatibility(
                    profiles[i], profiles[j]
                )
                pair_compatibilities.append(comp.overall_score)
        
        avg_compatibility = sum(pair_compatibilities) / len(pair_compatibilities) if pair_compatibilities else 0
        
        return {
            "group_size": len(profiles),
            "group_life_path": group_life_path,
            "group_destiny": group_destiny,
            "average_pair_compatibility": int(avg_compatibility),
            "pair_compatibilities": pair_compatibilities,
            "description": (
                f"Group of {len(profiles)} people. Shared life path: {group_life_path}. "
                f"Shared destiny: {group_destiny}. Average pair match: {int(avg_compatibility)}%"
            )
        }
