from todo.errors import CategoryNotFound
from todo.extensions import db
from todo.models.category import Category


def list_categories():
    # Сортировка по position — для drag-and-drop
    return Category.query.order_by(Category.position).all()


def create_category(name: str) -> Category:
    # Вычисляем следующую позицию: max(position) + 1
    # .scalar() вернёт одно значение или None, если таблица пустая
    max_pos = db.session.query(db.func.max(Category.position)).scalar() or 0

    category = Category(name=name, position=max_pos + 1)
    db.session.add(category)
    db.session.commit()
    return category


def get_category(category_id: int) -> Category:
    # db.session.get — современный способ получить по PK (вместо .query.get)
    category = db.session.get(Category, category_id)
    if category is None:
        raise CategoryNotFound(category_id)
    return category


def delete_category(category_id: int) -> None:
    category = get_category(category_id)
    # Каскад "all, delete-orphan" в модели Category удалит все её списки,
    # а каскад в TaskList удалит все задачи этих списков.
    db.session.delete(category)
    db.session.commit()
