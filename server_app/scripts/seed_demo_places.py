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

from decimal import Decimal

from core.config import settings
from database.session import Base, LocalSession, engine
from models import BusinessRepresentative, Place, PlaceImage


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
        biz = db.query(BusinessRepresentative).filter(BusinessRepresentative.username == seed_username).first()
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

            already_exists = (
                db.query(Place)
                .filter(Place.business_id == biz.id, Place.place_type == cluster_id)
                .first()
                is not None
            )
            if already_exists:
                continue

            for i in range(3):
                place = Place(
                    business_id=biz.id,
                    name=title if i == 0 else f"{title} · вариант {i + 1}",
                    place_type=cluster_id,
                    location=meta,
                    interesting_fact=facts[i] if i < len(facts) else "",
                    description=descs[i] if i < len(descs) else "",
                    description_ai=descs[i] if i < len(descs) else "",
                    price=price * (Decimal("0.92") if i == 1 else Decimal("1.04") if i == 2 else Decimal("1.00")),
                )
                db.add(place)
                db.flush()  # чтобы place_id появился

                # Заглушка картинок (публичные URL)
                for j in range(1, 3):
                    img = PlaceImage(
                        place_id=place.place_id,
                        image_url=f"https://picsum.photos/seed/{cluster_id}-{i}-{j}/600/400",
                    )
                    db.add(img)

        db.commit()
        print("Seed completed.")
    finally:
        db.close()


if __name__ == "__main__":
    print("DATABASE_URL:", settings.DATABASE_URL)
    main()

