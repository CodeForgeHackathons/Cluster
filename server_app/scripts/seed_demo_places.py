"""
Заливает демо-данные в PostgreSQL:
- business_representatives
- places
- place_images

Дальше нужно:
1) посчитать embeddings: POST /places/compute-embeddings (или через сценарий ниже)
2) протестировать: POST /itinerary/generate
"""

from __future__ import annotations

import sys
import os

# Добавляем /app в путь, чтобы скрипт работал из любого рабочего каталога
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from decimal import Decimal

sys.path.append("/app")

from core.config import settings
from database.session import Base, LocalSession, engine
from models import BusinessRepresentative, Cluster, Place, PlaceImage

# Реальные фото Краснодарского края и тематические (Unsplash, бесплатная лицензия)
CLUSTER_IMAGES: dict[str, list[str]] = {
    "cl1": [  # море, пляж
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=600&h=400&fit=crop",
    ],
    "cl2": [  # природа, озеро
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=400&fit=crop",
    ],
    "cl3": [  # работа с видом
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop",
    ],
    "cl4": [  # вино, дегустации
        "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=400&fit=crop",
    ],
    "cl5": [  # семья, дети
        "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=600&h=400&fit=crop",
    ],
    "cl6": [  # станица, ремесла
        "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
    ],
}

# Демо 3D туры AVALIN для "вау"-эффекта
DEMO_AVALIN_TOURS: dict[str, list[str]] = {
    "cl1": [
        "https://demo.avalin.ru/tours/beach-resort-360",
        "https://demo.avalin.ru/tours/seafood-restaurant-360",
        "https://demo.avalin.ru/tours/water-sports-360",
    ],
    "cl2": [
        "https://demo.avalin.ru/tours/forest-lake-360",
        "https://demo.avalin.ru/tours/eco-hotel-360",
        "https://demo.avalin.ru/tours/nature-trail-360",
    ],
    "cl3": [
        "https://demo.avalin.ru/tours/coworking-360",
        "https://demo.avalin.ru/tours/rooftop-cafe-360",
        "https://demo.avalin.ru/tours/art-gallery-360",
    ],
    "cl4": [
        "https://demo.avalin.ru/tours/wine-cellar-360",
        "https://demo.avalin.ru/tours/vineyard-360",
        "https://demo.avalin.ru/tours/wine-tasting-360",
    ],
    "cl5": [
        "https://demo.avalin.ru/tours/kids-playground-360",
        "https://demo.avalin.ru/tours/family-cafe-360",
        "https://demo.avalin.ru/tours/children-museum-360",
    ],
    "cl6": [
        "https://demo.avalin.ru/tours/quiet-library-360",
        "https://demo.avalin.ru/tours/meditation-room-360",
        "https://demo.avalin.ru/tours/handmade-store-360",
    ],
}

STUB_CLUSTERS = [
    {
        "cluster_id": "cl1",
        "title": "Отель и прогулки у моря",
        "meta": "Краснодарский край · 4–5 км от центра",
        "price": 7361,
        "facts": ["Соль в воздухе", "Закат рядом", "Тихая бухта"],
        "descs": [
            "Сценарий у воды: утренний кофе, короткие тропы и вечерний свет.",
            "Неспешный темп: больше воздуха и “медленных” остановок рядом.",
            "Добавили “вау”-кадры: видовые точки и мягкая прогулка.",
        ],
    },
    {
        "cluster_id": "cl2",
        "title": "Дом среди природы",
        "meta": "Тихий район · до озера 1–2 км",
        "price": 5429,
        "facts": ["Тишина рядом", "Чай и зелень", "Туман красиво"],
        "descs": [
            "Уединённый сценарий: прогулка к воде, тёплый свет в доме и отдых “вдали от мира”.",
            "Больше тишины: короткие дистанции, зеленые паузы, спокойный темп.",
            "Рядом тропа и озеро: легко собираться и возвращаться “в уют”.",
        ],
    },
    {
        "cluster_id": "cl3",
        "title": "Локация для работы с видом",
        "meta": "Кофе, терраса, рабочие места",
        "price": 7854,
        "facts": ["Фокус и вид", "Дела в тишине", "Заметки на свежем"],
        "descs": [
            "Утро с видом: рабочий блок + короткая прогулка без спешки.",
            "Фокус и воздух: перемещаемся мягко между точками “дела/вида”.",
            "Вечером — спокойные заметки и атмосферный свет на локации.",
        ],
    },
    {
        "cluster_id": "cl4",
        "title": "Винные маршруты и дегустации",
        "meta": "Вкус, атмосфера и местные продукты",
        "price": 12328,
        "facts": ["Вино в бокале", "Ремесло вкусно", "Ветер в листьях"],
        "descs": [
            "Соберите историю вкуса: дегустация, экскурсия и “вкусный” финал дня.",
            "В помещении — комфортно и вкусно: без спешки и с хорошими паузами.",
            "Подача и атмосфера: видовые остановки по погоде + дегустации.",
        ],
    },
    {
        "cluster_id": "cl5",
        "title": "Куда сходить с детьми",
        "meta": "Интересно взрослым и детям",
        "price": 6000,
        "facts": ["Игра и вкус", "Творчество рядом", "Шаги в радость"],
        "descs": [
            "Семейный блок: игра, короткие сценарии и понятная логистика по времени.",
            "Мягкие остановки: чтобы детям было интересно, а взрослым спокойно.",
            "Вкус и творчество рядом: дневные активности + вечерняя прогулка.",
        ],
    },
    {
        "cluster_id": "cl6",
        "title": "Нестандартная станица и ремесла",
        "meta": "Меньше людей · больше впечатлений",
        "price": 7010,
        "facts": ["Тайные мастерские", "Дела руками", "Фото без толпы"],
        "descs": [
            "Ремесленная история: мастерская рядом, спокойный темп и атмосферные детали.",
            "Фото и тишина: меньше толпы, больше смысла и “своих” точек.",
            "Дела руками: интерактив + прогулка по настроению.",
        ],
    },
]


def main() -> None:
    # Важно: script рассчитан на “чистую” БД.
    # Если хочешь перезапуск — сделай новую БД или очисти таблицы вручную.
    Base.metadata.create_all(bind=engine)
    db = LocalSession()
    try:
        seed_username = "seed_demo_biz"
        seed_email = "seed_demo_biz@example.com"

        # 1) business representative (минимум для внешнего ключа places.business_id)
        biz = (
            db.query(BusinessRepresentative)
            .filter(BusinessRepresentative.username == seed_username)
            .first()
        )
        if biz is None:
            biz = BusinessRepresentative(
                username=seed_username,
                email=seed_email,
                full_name="Seed Demo Business",
                password_hash="seed_password_hash",
                is_active=True,
            )
            db.add(biz)
            db.commit()
            db.refresh(biz)

        # 2) places + images
        for cluster in STUB_CLUSTERS:
            cluster_id = cluster["cluster_id"]
            title = cluster["title"]
            meta = cluster["meta"]
            price = Decimal(str(cluster["price"]))
            facts = cluster["facts"]
            descs = cluster["descs"]

            cluster_obj = db.get(Cluster, cluster_id)
            if cluster_obj is None:
                cluster_obj = Cluster(
                    id=cluster_id,
                    business_id=biz.id,
                    title=title,
                    meta=meta,
                    description=descs[0] if descs else None,
                    status="approved",
                )
                db.add(cluster_obj)
                db.commit()
                db.refresh(cluster_obj)

            already_exists = (
                db.query(Place)
                .filter(Place.business_id == biz.id, Place.place_type == cluster_id)
                .first()
            )
            if already_exists:
                continue

            for i in range(3):
# Получаем AVALIN тур для этого места
                avalin_tours = DEMO_AVALIN_TOURS.get(cluster_id, [])
                avalin_url = avalin_tours[i] if i < len(avalin_tours) else None
                place = Place(
                    business_id=biz.id,
                    cluster_id=cluster_id,
                    name=title if i == 0 else f"{title} · вариант {i + 1}",
                    place_type=cluster_id,
                    location=meta,
                    interesting_fact=facts[i] if i < len(facts) else "",
                    description=descs[i] if i < len(descs) else "",
                    description_ai=descs[i] if i < len(descs) else "",
price=price
                    * (
                        Decimal("0.92")
                        if i == 1
                        else Decimal("1.04")
                        if i == 2
                        else Decimal("1.00")
                    ),
                    avalin_tour_url=avalin_url,
                )
                db.add(place)
                db.flush()  # чтобы place_id появился

                # Реальные тематические фото (Unsplash)
                img_urls = CLUSTER_IMAGES.get(
                    cluster_id,
                    [
                        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=400&fit=crop",
                    ]
                    * 2,
                )
                for j in range(1, 3):
                    url = img_urls[(i + j) % len(img_urls)]
                    img = PlaceImage(place_id=place.place_id, image_url=url)
                    db.add(img)

        db.commit()
        print("Seed completed.")
    finally:
        db.close()


if __name__ == "__main__":
    print("DATABASE_URL:", settings.DATABASE_URL)
    main()
