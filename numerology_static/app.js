// API базовый URL
const API_BASE_URL = '';

const i18n = window.i18n || {};
const t = (key, vars) => (typeof i18n.t === 'function' ? i18n.t(key, vars) : key);

// Элементы DOM
const form = document.getElementById('numerologyForm');
const loadingDiv = document.getElementById('loading');
const resultsDiv = document.getElementById('results');
const errorDiv = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');

function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function dateValueFromInput(value) {
    if (!value) {
        return null;
    }
    const parts = value.split('-');
    if (parts.length !== 3) {
        return null;
    }
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (!year || !month || !day) {
        return null;
    }
    return year * 10000 + month * 100 + day;
}

const todayISO = formatDateISO(new Date());
const todayValue = dateValueFromInput(todayISO);

function setDateInputLimits() {
    const maxInputs = ['birthDate', 'currentDate', 'person1BirthDate', 'person2BirthDate'];
    maxInputs.forEach((id) => {
        const input = document.getElementById(id);
        if (input) {
            input.setAttribute('max', todayISO);
        }
    });

    const birthDateInput = document.getElementById('birthDate');
    const currentDateInput = document.getElementById('currentDate');
    if (birthDateInput && currentDateInput) {
        birthDateInput.addEventListener('change', () => {
            currentDateInput.min = birthDateInput.value || '';
            if (currentDateInput.value && birthDateInput.value && currentDateInput.value < birthDateInput.value) {
                currentDateInput.value = birthDateInput.value;
            }
        });
    }
}

setDateInputLimits();

// Обработчик отправки формы
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Скрываем предыдущие результаты и ошибки
    hideAll();
    
    // Получаем данные формы
    const fullName = document.getElementById('fullName').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const currentDate = document.getElementById('currentDate').value || null;
    
    // Валидация
    if (!fullName || !birthDate) {
        showError(t('numerology_messages.required_fields'));
        return;
    }

    const birthValue = dateValueFromInput(birthDate);
    if (!birthValue) {
        showError(t('numerology_messages.invalid_birth'));
        return;
    }
    if (birthValue > todayValue) {
        showError(t('numerology_messages.birth_future'));
        return;
    }

    if (currentDate) {
        const currentValue = dateValueFromInput(currentDate);
        if (!currentValue) {
            showError(t('numerology_messages.invalid_current'));
            return;
        }
        if (currentValue > todayValue) {
            showError(t('numerology_messages.current_future'));
            return;
        }
        if (currentValue < birthValue) {
            showError(t('numerology_messages.current_before_birth'));
            return;
        }
    }
    
    // Показываем загрузку
    showLoading();
    
    try {
        // Формируем запрос
        const requestData = {
            full_name: fullName,
            birth_date: birthDate
        };
        
        if (currentDate) {
            requestData.current_date = currentDate;
        }
        
        // Отправляем запрос
        const response = await fetch(`${API_BASE_URL}/api/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || t('numerology_messages.calculation_failed'));
        }
        
        const data = await response.json();
        
        // Отображаем результаты
        displayResults(data);
        
    } catch (error) {
        showError(error.message || t('numerology_messages.generic_error'));
    }
});

// Функция отображения результатов
function displayResults(data) {
    hideAll();
    resultsDiv.classList.remove('hidden');
    
    // Основные числа
    displayMainNumber('lifePath', data.profile.life_path);
    displayMainNumber('destiny', data.profile.destiny);
    displayMainNumber('soul', data.profile.soul);
    displayMainNumber('personality', data.profile.personality);
    
    // Персональные циклы
    displayCycle('personalYear', data.personal_cycles.year);
    displayCycle('personalMonth', data.personal_cycles.month);
    displayCycle('personalDay', data.personal_cycles.day);
    
    // Пики
    displayPinnacles(data.pinnacles);
    
    // Вызовы
    displayChallenges(data.challenges);
}

// Отображение основного числа
function displayMainNumber(prefix, numberData) {
    const number = numberData.number;
    const meaning = numberData.meaning || {};
    const isMaster = numberData.is_master;
    const formula = numberData.formula || {};
    
    // Обновляем число
    document.getElementById(`${prefix}Number`).textContent = number;
    
    // Обновляем название
    const nameEl = document.getElementById(`${prefix}Name`);
    nameEl.textContent = meaning.name || t('numerology_messages.number_label', { number });
    
    // Обновляем описание
    const descEl = document.getElementById(`${prefix}Description`);
    descEl.textContent = meaning.description || '';
    
    // Обновляем ключевые слова
    const keywordsEl = document.getElementById(`${prefix}Keywords`);
    keywordsEl.innerHTML = '';
    if (meaning.keywords && meaning.keywords.length > 0) {
        meaning.keywords.forEach(keyword => {
            const span = document.createElement('span');
            span.className = 'keyword';
            span.textContent = keyword;
            keywordsEl.appendChild(span);
        });
    }
    
    // Отображаем формулу
    const formulaEl = document.getElementById(`${prefix}Formula`);
    if (formulaEl && formula.steps) {
        formulaEl.innerHTML = '';
        const desc = document.createElement('p');
        desc.className = 'formula-description';
        desc.textContent = formula.description || '';
        formulaEl.appendChild(desc);
        
        const stepsList = document.createElement('ol');
        stepsList.className = 'formula-steps';
        formula.steps.forEach(step => {
            const li = document.createElement('li');
            li.textContent = step;
            stepsList.appendChild(li);
        });
        formulaEl.appendChild(stepsList);
    }
    
    // Добавляем класс мастер-числа
    const card = document.getElementById(`${prefix}Card`);
    if (isMaster) {
        card.classList.add('master');
    } else {
        card.classList.remove('master');
    }
}

// Отображение персонального цикла
function displayCycle(prefix, cycleData) {
    const number = cycleData.number;
    const meaning = cycleData.meaning || {};
    const formula = cycleData.formula || {};
    
    document.getElementById(`${prefix}Number`).textContent = number;
    const fallbackKey =
        prefix === 'personalYear'
            ? 'numerology_messages.personal_year_energy'
            : prefix === 'personalMonth'
                ? 'numerology_messages.personal_month_energy'
                : 'numerology_messages.personal_day_energy';
    document.getElementById(`${prefix}Description`).textContent =
        meaning.description || t(fallbackKey, { number });
    
    // Отображаем формулу
    const formulaEl = document.getElementById(`${prefix}Formula`);
    if (formulaEl && formula.steps) {
        formulaEl.innerHTML = '';
        const desc = document.createElement('p');
        desc.className = 'formula-description';
        desc.textContent = formula.description || '';
        formulaEl.appendChild(desc);
        
        const stepsList = document.createElement('ol');
        stepsList.className = 'formula-steps';
        formula.steps.forEach(step => {
            const li = document.createElement('li');
            li.textContent = step;
            stepsList.appendChild(li);
        });
        formulaEl.appendChild(stepsList);
    }
}

// Отображение пиков
function displayPinnacles(pinnacles) {
    const grid = document.getElementById('pinnaclesGrid');
    grid.innerHTML = '';
    
    pinnacles.forEach((pinnacle, index) => {
        const card = createPinnacleCard(pinnacle, index + 1);
        grid.appendChild(card);
    });
}

// Создание карточки пика
function createPinnacleCard(pinnacle, index) {
    const card = document.createElement('div');
    card.className = 'pinnacle-card';
    
    const ageText = pinnacle.age_end
        ? t('numerology_messages.ages_range', { start: pinnacle.age_start, end: pinnacle.age_end })
        : t('numerology_messages.age_from', { start: pinnacle.age_start });
    
    card.innerHTML = `
        <h4>${t('numerology_messages.peak', { index })}</h4>
        <div class="number">${pinnacle.number}</div>
        <div class="age">${ageText}</div>
        <div class="description">${pinnacle.description || ''}</div>
    `;
    
    return card;
}

// Отображение вызовов
function displayChallenges(challenges) {
    const grid = document.getElementById('challengesGrid');
    grid.innerHTML = '';
    
    challenges.forEach((challenge, index) => {
        const card = createChallengeCard(challenge, index + 1);
        grid.appendChild(card);
    });
}

// Создание карточки вызова
function createChallengeCard(challenge, index) {
    const card = document.createElement('div');
    card.className = 'challenge-card';
    
    const ageText = challenge.age_end
        ? t('numerology_messages.ages_range', { start: challenge.age_start, end: challenge.age_end })
        : t('numerology_messages.age_from', { start: challenge.age_start });
    
    card.innerHTML = `
        <h4>${t('numerology_messages.lesson', { index })}</h4>
        <div class="number">${challenge.number}</div>
        <div class="age">${ageText}</div>
        <div class="description">${challenge.description || ''}</div>
    `;
    
    return card;
}

// Показать загрузку
function showLoading() {
    hideAll();
    loadingDiv.classList.remove('hidden');
}

// Показать ошибку
function showError(message) {
    hideAll();
    errorMessage.textContent = message;
    errorDiv.classList.remove('hidden');
}

// Скрыть все
function hideAll() {
    loadingDiv.classList.add('hidden');
    resultsDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
}

// Устанавливаем сегодняшнюю дату по умолчанию для currentDate
const currentDateInput = document.getElementById('currentDate');
if (currentDateInput) {
    currentDateInput.value = todayISO;
}

// Система вкладок
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Убираем активный класс у всех кнопок и контента
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Добавляем активный класс к выбранной кнопке и контенту
        button.classList.add('active');
        document.getElementById(`${targetTab}Tab`).classList.add('active');
    });
});

// Обработчик формы совместимости
const compatibilityForm = document.getElementById('compatibilityForm');
const compatibilityResults = document.getElementById('compatibilityResults');
const compatibilityLoading = document.getElementById('compatibilityLoading');
const compatibilityError = document.getElementById('compatibilityError');
const compatibilityErrorMessage = document.getElementById('compatibilityErrorMessage');

compatibilityForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Скрываем предыдущие результаты
    compatibilityResults.classList.add('hidden');
    compatibilityError.classList.add('hidden');
    
    // Получаем данные
    const person1Name = document.getElementById('person1Name').value.trim();
    const person1BirthDate = document.getElementById('person1BirthDate').value;
    const person2Name = document.getElementById('person2Name').value.trim();
    const person2BirthDate = document.getElementById('person2BirthDate').value;
    
    // Валидация
    if (!person1Name || !person1BirthDate || !person2Name || !person2BirthDate) {
        showCompatibilityError(t('numerology_messages.compatibility_required'));
        return;
    }

    const person1BirthValue = dateValueFromInput(person1BirthDate);
    const person2BirthValue = dateValueFromInput(person2BirthDate);
    if (!person1BirthValue || !person2BirthValue) {
        showCompatibilityError(t('numerology_messages.compatibility_invalid_dates'));
        return;
    }
    if (person1BirthValue > todayValue || person2BirthValue > todayValue) {
        showCompatibilityError(t('numerology_messages.compatibility_future'));
        return;
    }
    
    // Показываем загрузку
    compatibilityLoading.classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/compatibility`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                person1: {
                    full_name: person1Name,
                    birth_date: person1BirthDate
                },
                person2: {
                    full_name: person2Name,
                    birth_date: person2BirthDate
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || t('numerology_messages.compatibility_failed'));
        }
        
        const data = await response.json();
        displayCompatibilityResults(data);
        
    } catch (error) {
        showCompatibilityError(error.message || t('numerology_messages.compatibility_generic'));
    } finally {
        compatibilityLoading.classList.add('hidden');
    }
});

// Отображение результатов совместимости
function displayCompatibilityResults(data) {
    compatibilityResults.classList.remove('hidden');
    
    // Общая оценка
    const score = data.overall_score;
    document.getElementById('compatibilityScore').textContent = score;
    document.getElementById('compatibilityDescription').textContent = data.description;
    
    // Обновляем круг оценки (цвет в зависимости от процента)
    const scoreCircle = document.getElementById('compatibilityScoreCircle');
    scoreCircle.className = 'score-circle';
    if (score >= 85) {
        scoreCircle.classList.add('excellent');
    } else if (score >= 70) {
        scoreCircle.classList.add('good');
    } else if (score >= 60) {
        scoreCircle.classList.add('moderate');
    } else {
        scoreCircle.classList.add('challenging');
    }
    
    // Детали совместимости
    displayCompatibilityDetail('lifePath', data.compatibilities.life_path);
    displayCompatibilityDetail('destiny', data.compatibilities.destiny);
    displayCompatibilityDetail('soul', data.compatibilities.soul);
    displayCompatibilityDetail('personality', data.compatibilities.personality);
    
    // Групповое число
    document.getElementById('pairNumber').textContent = data.pair_number;
    
    // Формула группового числа
    const pairFormula = document.getElementById('pairNumberFormula');
    if (pairFormula) {
        const p1LP = data.person1.life_path;
        const p2LP = data.person2.life_path;
        const sum = p1LP + p2LP;
        pairFormula.textContent = t('numerology_messages.pair_example', {
            p1: p1LP,
            p2: p2LP,
            sum,
            pair: data.pair_number
        });
    }
    
    // Рекомендации
    const recommendationsList = document.getElementById('recommendationsList');
    recommendationsList.innerHTML = '';
    data.recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        recommendationsList.appendChild(li);
    });
}

// Отображение деталей совместимости
function displayCompatibilityDetail(prefix, compData) {
    const num1 = compData.numbers[0];
    const num2 = compData.numbers[1];
    
    // Формируем строку с числами (показываем мастер-числа)
    let numbersDisplay = `${num1}`;
    if ([11, 22, 33].includes(num1)) {
        numbersDisplay += ` (${t('numerology_messages.master_number')})`;
    }
    numbersDisplay += ` + ${num2}`;
    if ([11, 22, 33].includes(num2)) {
        numbersDisplay += ` (${t('numerology_messages.master_number')})`;
    }
    
    document.getElementById(`${prefix}Numbers`).textContent = numbersDisplay;
    document.getElementById(`${prefix}Score`).textContent = `${compData.score}%`;
    document.getElementById(`${prefix}Desc`).textContent = compData.description;
    
    // Добавляем класс в зависимости от типа
    const item = document.getElementById(`${prefix}Comp`);
    item.className = 'compatibility-item';
    item.classList.add(compData.type);
}

// Показать ошибку совместимости
function showCompatibilityError(message) {
    compatibilityErrorMessage.textContent = message;
    compatibilityError.classList.remove('hidden');
}
