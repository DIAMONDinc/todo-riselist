from flask import Blueprint, jsonify, request

from todo.lists.schemas import TaskListSchema
from todo.lists.services import (
    create_list,
    delete_list,
    get_list,
    list_lists,
    update_list,
)

lists_bp = Blueprint("lists", __name__)

list_schema = TaskListSchema()
lists_schema = TaskListSchema(many=True)


@lists_bp.get("/")
def get_lists():
    """
    GET /lists/ — все списки.
    GET /lists/?category_id=1 — только списки категории 1.
    """
    category_id = request.args.get("category_id", type=int)
    lists = list_lists(category_id=category_id)
    return jsonify(lists_schema.dump(lists))


@lists_bp.post("/")
def add_list():
    """
    POST /lists/ — создать список.
    Тело: {"name": "Срочное", "category_id": 1}.
    """
    data = list_schema.load(request.get_json())
    task_list = create_list(**data)
    return jsonify(list_schema.dump(task_list)), 201


@lists_bp.get("/<int:list_id>")
def get_one_list(list_id: int):
    """GET /lists/<id> — один список."""
    task_list = get_list(list_id)
    return jsonify(list_schema.dump(task_list))


@lists_bp.delete("/<int:list_id>")
def remove_list(list_id: int):
    """DELETE /lists/<id> — удалить список (и все его задачи)."""
    delete_list(list_id)
    return "", 204


@lists_bp.patch("/<int:list_id>")
def update(list_id: int):
    """PATCH /lists/<id> — обновить список (пока только название)."""
    data = request.get_json()
    name = data.get("name")
    if not name or not name.strip():
        return jsonify({"error": "name is required"}), 400

    task_list = update_list(list_id, name.strip())
    return jsonify(list_schema.dump(task_list))
