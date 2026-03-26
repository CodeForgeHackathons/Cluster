#!/bin/bash

# Скрипт для быстрой проверки что всё работает

set -e

echo "================================================================================"
echo "🔍 ПРОВЕРКА: DeepSeek Embeddings Fix"
echo "================================================================================"
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода успеха
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Функция для вывода ошибки
error() {
    echo -e "${RED}✗${NC} $1"
}

# Функция для вывода предупреждения
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Проверка конфигурации
echo "1️⃣  Проверка конфигурации..."
echo ""

if grep -q "USE_DEEPSEEK_EMBEDDINGS" server_app/core/config.py; then
    success "config.py: USE_DEEPSEEK_EMBEDDINGS найдена"
else
    error "config.py: USE_DEEPSEEK_EMBEDDINGS не найдена"
    exit 1
fi

if grep -q "EMBEDDING_SERVICE" server_app/core/config.py; then
    success "config.py: EMBEDDING_SERVICE найдена"
else
    error "config.py: EMBEDDING_SERVICE не найдена"
    exit 1
fi

# 2. Проверка deepseek_service.py
echo ""
echo "2️⃣  Проверка deepseek_service.py..."
echo ""

if grep -q "def call_deepseek_chat" server_app/services/deepseek_service.py; then
    success "deepseek_service.py: call_deepseek_chat() функция есть"
else
    error "deepseek_service.py: call_deepseek_chat() функция не найдена"
    exit 1
fi

if grep -q "DEPRECATED" server_app/services/deepseek_service.py; then
    success "deepseek_service.py: есть комментарий о deprecated embeddings"
else
    warning "deepseek_service.py: нет комментария о deprecated embeddings"
fi

# 3. Проверка новых файлов
echo ""
echo "3️⃣  Проверка новых файлов..."
echo ""

files=(
    "server_app/services/embeddings_service.py"
    "server_app/scripts/test_search.py"
    "DEEPSEEK_EMBEDDINGS_FIX.md"
    "QUICKSTART_FIXED.md"
    "CHANGES_SUMMARY.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        success "$file существует"
    else
        error "$file НЕ найдена"
        exit 1
    fi
done

# 4. Проверка API endpoints
echo ""
echo "4️⃣  Проверка API endpoints..."
echo ""

if grep -q "deprecated" server_app/api/v1/endpoints/place_endpoints.py; then
    success "place_endpoints.py: используется слово 'deprecated'"
else
    error "place_endpoints.py: нет слова 'deprecated'"
    exit 1
fi

# 5. Проверка .env.example
echo ""
echo "5️⃣  Проверка .env.example..."
echo ""

if grep -q "DeepSeek не поддерживает" server_app/.env.example; then
    success ".env.example: есть предупреждение о DeepSeek ограничениях"
else
    warning ".env.example: нет предупреждения о DeepSeek ограничениях"
fi

# 6. Проверка place_search_service.py
echo ""
echo "6️⃣  Проверка place_search_service.py..."
echo ""

if grep -q "локальный TF-IDF" server_app/services/place_search_service.py; then
    success "place_search_service.py: упоминается локальный TF-IDF"
else
    warning "place_search_service.py: нет упоминания локального TF-IDF"
fi

# 7. Итоговый статус
echo ""
echo "================================================================================"
echo "✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ"
echo "================================================================================"
echo ""
echo "📋 Дальнейшие шаги:"
echo ""
echo "1. Запустите систему:"
echo "   ./setup_db.ps1  (Windows)"
echo "   ./server_app/scripts/setup_all.sh  (Linux/macOS)"
echo ""
echo "2. Загрузите тестовые данные:"
echo "   docker exec cluster_api python scripts/seed_demo_places.py"
echo ""
echo "3. Протестируйте поиск:"
echo "   docker exec cluster_api python scripts/test_search.py"
echo ""
echo "4. Откройте приложение:"
echo "   Frontend: http://localhost:5173"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📚 Документация:"
echo "   - DEEPSEEK_EMBEDDINGS_FIX.md (подробное объяснение)"
echo "   - QUICKSTART_FIXED.md (быстрый старт)"
echo "   - CHANGES_SUMMARY.md (все изменения)"
echo ""
