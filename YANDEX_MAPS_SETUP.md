# 🗺️ Настройка Яндекс Карт API

## 🎯 Почему Яндекс Карты?

### Преимущества для РФ:
- ✅ **Лучшее покрытие России** - детальные карты всех городов
- ✅ **Учет пробок** - реальные маршруты с трафиком
- ✅ **Точные адреса** - полная база адресов РФ
- ✅ **Навигация** - разные типы маршрутов (авто, пешком, транспорт)
- ✅ **Бесплатно** - щедрые лимиты для некоммерческого использования

## 🔑 Получение API ключа

### 1. Регистрация в Яндекс Клуб
1. Перейдите: https://developer.tech.yandex.ru/
2. Войдите через Яндекс ID
3. Создайте новое приложение:
   - Название: "Cluster Travel Platform"
   - Платформа: "Web"
   - Redirect URI: `http://localhost:5173`

### 2. Активация API Карт
1. В созданном приложении найдите "Карты"
2. Включите API:
   - JavaScript API и HTTP Геокодер
   - JavaScript API 2.1
3. Скопируйте API ключ

### 3. Настройка проекта
Скопируйте API ключ в файл `RouteMapYandex.vue`:

```javascript
const YANDEX_API_KEY = 'ВАШ_API_КЛЮЧ' // Замените на реальный ключ
```

## 🚀 Использование

### В RoutePlannerPage.vue:
```vue
import RouteMap from '../components/RouteMapYandex.vue'
import type { MapPoint } from '../components/RouteMapYandex.vue'
```

### Типы маршрутов:
- `auto` - автомобильные (с пробками)
- `pedestrian` - пешеходные маршруты  
- `masstransit` - общественный транспорт

## 📊 Лимиты API

| Тариф | Запросы в день | Цена |
|--------|----------------|-------|
| Бесплатный | 25,000 | 0₽ |
| Базовый | 100,000 | ~1,000₽/мес |
| Профессиональный | 1,000,000 | ~10,000₽/мес |

Для демо и хакатона **бесплатного тарифа достаточно!**

## 🛠️ Альтернативы

Если нет возможности получить API ключ:

### 1. Leaflet + OSRM (уже реализовано)
```vue
import RouteMap from '../components/RouteMapSimple.vue'
```

### 2. OpenStreetMap (бесплатно)
```vue
import RouteMap from '../components/RouteMapOSM.vue'
```

### 3. Смешанный подход
- Яндекс для геокодинга (поиск адресов)
- OSRM для маршрутизации (бесплатно)

## 🔧 Тестирование

### Проверка API ключа:
```javascript
// В консоли браузера
ymaps.ready(() => {
  console.log('Яндекс Карты загружены успешно')
})
```

### Проверка маршрутов:
1. Откройте http://localhost:5173
2. Создайте маршрут
3. Проверьте консоль на ошибки

## 🎨 Кастомизация

### Стили маркеров:
```javascript
const placemark = new ymaps.Placemark(coords, {
  preset: 'islands#darkBlueDotIcon',
  iconColor: '#0066cc'
})
```

### Опции маршрутов:
```javascript
const multiRoute = new ymaps.multiRouter.multiRoute({
  referencePoints: points,
  params: {
    routingMode: 'auto',
    avoidTrafficJams: true,
    results: 1
  }
})
```

## 🚨 Возможные проблемы

### Ошибка "API key is invalid":
- Проверьте правильность ключа
- Убедитесь, что домен добавлен в доверенные

### Ошибка "Requests limit exceeded":
- Используйте кэширование результатов
- Оптимизируйте количество запросов

### Маршруты не строятся:
- Проверьте подключение к интернету
- Убедитесь, что координаты корректны

## 📞 Поддержка

- Документация: https://yandex.ru/dev/maps/
- Поддержка: https://yandex.ru/support/maps-api/
- Примеры: https://yandex.ru/dev/maps/jsapi/2.1/examples/

---

**Готово к использованию!** 🗺️
