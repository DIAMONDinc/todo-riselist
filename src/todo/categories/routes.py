from flask import Blueprint, jsonify, request

from todo.categories.schemas import CategorySchema
from todo.categories.services import (
    create_category,
    delete_category,
    get_category,
    list_categories,
)

categories_bp = Blueprint("categories", __name__)

# Один экземпляр схемы для одной категории, второй — для списка
category_schema = CategorySchema()
categories_schema = CategorySchema(many=True)


@categories_bp.get("/")
def get_categories():
    """GET /categories/ — список всех категорий."""
    categories = list_categories()
    return jsonify(categories_schema.dump(categories))


@categories_bp.post("/")
def add_category():
    """POST /categories/ — создать категорию. Тело: {"name": "Работа"}."""
    data = category_schema.load(request.get_json())
    category = create_category(**data)
    return jsonify(category_schema.dump(category)), 201


@categories_bp.get("/<int:category_id>")
def get_one_category(category_id: int):
    """GET /categories/<id> — одна категория."""
    category = get_category(category_id)
    return jsonify(category_schema.dump(category))


@categories_bp.delete("/<int:category_id>")
def remove_category(category_id: int):
    """DELETE /categories/<id> — удалить категорию (и все её списки с задачами)."""
    delete_category(category_id)
    return "", 204
