from flask import jsonify
from marshmallow import ValidationError


class TaskNotFound(Exception):
    def __init__(self, task_id: int):
        self.task_id = task_id
        super().__init__(f"Task {task_id} not found")


class CategoryNotFound(Exception):
    def __init__(self, category_id: int):
        self.category_id = category_id
        super().__init__(f"Category {category_id} not found")


class ListNotFound(Exception):
    def __init__(self, list_id: int):
        self.list_id = list_id
        super().__init__(f"List {list_id} not found")


def register_error_handlers(app):
    @app.errorhandler(TaskNotFound)
    def handle_task_not_found(error):
        return jsonify({"error": "Task not found"}), 404

    @app.errorhandler(CategoryNotFound)
    def handle_category_not_found(error):
        return jsonify({"error": "Category not found"}), 404

    @app.errorhandler(ListNotFound)
    def handle_list_not_found(error):
        return jsonify({"error": "List not found"}), 404

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return jsonify({"error": error.messages}), 400
