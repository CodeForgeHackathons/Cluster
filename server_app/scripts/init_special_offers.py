"""
Инициализация демо спецпредложений от бизнеса.
"""

from __future__ import annotations

from decimal import Decimal
from datetime import date, timedelta

from core.config import settings
from database.session import Base, LocalSession, engine
from models import BusinessRepresentative, Place, SpecialOffer


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = LocalSession()
    
    try:
        # Находим бизнес-представителя и места
        biz = db.query(BusinessRepresentative).filter(BusinessRepresentative.username == "seed_demo_biz").first()
        if not biz:
            print("Business representative not found. Run seed_demo_places.py first.")
            return

        places = db.query(Place).filter(Place.business_id == biz.id).all()
        if not places:
            print("No places found. Run seed_demo_places.py first.")
            return

        # Демо спецпредложения
        demo_offers = [
            {
                "title": "Семейный выходной -15%",
                "description": "Специальная цена для семей с детьми в выходные дни",
                "discount_percent": 15.0,
                "place_types": ["cl1", "cl5"],  # море, семья
                "days_offset": 0,  # ближайшие выходные
            },
            {
                "title": "Дегустация вдвоем +1 бутылка",
                "description": "При заказе дегустации для двоих - дополнительная бутылка в подарок",
                "special_price": Decimal("2500.00"),
                "place_types": ["cl4"],  # вино
                "days_offset": 7,  # на следующей неделе
            },
            {
                "title": "Раннее бронирование -20%",
                "description": "Скидка 20% при бронировании за 14 дней",
                "discount_percent": 20.0,
                "place_types": ["cl2", "cl3"],  # природа, работа
                "days_offset": 14,  # через 2 недели
            },
            {
                "title": "Фотосессия в станичном стиле",
                "description": "Бесплатная фотосессия при бронировании ремесленной мастерской",
                "special_price": Decimal("1800.00"),
                "place_types": ["cl6"],  # ремесла
                "days_offset": 3,  # через 3 дня
            },
        ]

        today = date.today()
        
        for offer_data in demo_offers:
            # Находим подходящие места
            suitable_places = [p for p in places if p.place_type in offer_data["place_types"]]
            
            if not suitable_places:
                continue

            # Создаем предложения для каждого подходящего места
            for place in suitable_places[:2]:  # по 2 места на тип предложения
                start_date = today + timedelta(days=offer_data["days_offset"])
                end_date = start_date + timedelta(days=2)  # на выходные

                # Проверяем, что предложение еще не существует
                existing = db.query(SpecialOffer).filter(
                    SpecialOffer.place_id == place.place_id,
                    SpecialOffer.start_date == start_date
                ).first()
                
                if existing:
                    continue

                offer = SpecialOffer(
                    place_id=place.place_id,
                    business_id=biz.id,
                    title=offer_data["title"],
                    description=offer_data["description"],
                    discount_percent=offer_data.get("discount_percent"),
                    special_price=offer_data.get("special_price"),
                    start_date=start_date,
                    end_date=end_date,
                )
                
                db.add(offer)

        db.commit()
        print("Special offers initialized successfully.")
        
        # Вывод статистики
        total_offers = db.query(SpecialOffer).count()
        print(f"Total special offers created: {total_offers}")

    finally:
        db.close()


if __name__ == "__main__":
    print("DATABASE_URL:", settings.DATABASE_URL)
    main()
