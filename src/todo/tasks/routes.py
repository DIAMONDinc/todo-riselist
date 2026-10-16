from flask import Blueprint, jsonify, request

from todo.tasks.schemas import TaskSchema
from todo.tasks.services import (
    create_task,
    delete_task,
    list_tasks,
    reorder_tasks,
    toggle_task,
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
