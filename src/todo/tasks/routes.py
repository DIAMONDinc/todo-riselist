from flask import Blueprint, jsonify, request

from todo.tasks.schemas import TaskSchema
from todo.tasks.services import (
    create_task,
    delete_task,
    list_tasks,
    reorder_tasks,
    toggle_task,
    move_task,
)

tasks_bp = Blueprint("tasks", __name__)
task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)


@tasks_bp.get("/")
def get_tasks():
    tasks = list_tasks()
    return jsonify(tasks_schema.dump(tasks))


@tasks_bp.post("/")
def add_task():
    data = task_schema.load(request.get_json())
    task = create_task(**data)
    return jsonify(task_schema.dump(task)), 201


@tasks_bp.patch("/<int:task_id>/toggle")
def toggle(task_id: int):
    task = toggle_task(task_id)
    return jsonify(task_schema.dump(task))


@tasks_bp.delete("/<int:task_id>")
def remove(task_id: int):
    delete_task(task_id)
    return "", 204


@tasks_bp.post("/reorder")
def reorder():
    data = request.get_json()
    task_ids = data.get("task_ids", [])
    reorder_tasks(task_ids)
    return jsonify({"status": "ok"}), 200


# ============================================================
# Вложенные роуты: задачи внутри конкретного списка
# URL: /tasks/by-list/<list_id>
# ============================================================
from todo.lists.services import get_list


@tasks_bp.get("/by-list/<int:list_id>")
def get_tasks_by_list(list_id: int):
    """
    GET /tasks/by-list/<list_id> — все задачи конкретного списка.
    Если списка нет — get_list бросит ListNotFound (404 через error handler).
    """
    get_list(list_id)
    tasks = list_tasks(list_id=list_id)
    return jsonify(tasks_schema.dump(tasks))


@tasks_bp.post("/by-list/<int:list_id>")
def add_task_to_list(list_id: int):
    """
    POST /tasks/by-list/<list_id> — создать задачу в списке.
    Тело: {"title": "...", "description": "..."}
    list_id берётся из URL — игнорируем возможный list_id в теле.
    """
    get_list(list_id)
    data = task_schema.load(request.get_json())
    data["list_id"] = list_id
    task = create_task(**data)
    return jsonify(task_schema.dump(task)), 201


@tasks_bp.patch("/<int:task_id>/move")
def move(task_id: int):
    """
    PATCH /tasks/<id>/move — переместить задачу в другой список.
    Тело: {"list_id": 5}
    """
    data = request.get_json()
    new_list_id = data.get("list_id")
    if not new_list_id:
        return jsonify({"error": "list_id is required"}), 400

    task = move_task(task_id, new_list_id)
    return jsonify(task_schema.dump(task))
