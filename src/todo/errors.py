from flask import jsonify
from marshmallow import ValidationError


class TaskNotFound(Exception):
    def __init__(self, task_id: int):
        self.task_id = task_id
        super().__init__(f"Task {task_id} not found")


def register_error_handlers(app):
    @app.errorhandler(TaskNotFound)
    def handle_task_not_found(error):
        return jsonify({"error": "Task not found"}), 404

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return jsonify({"error": error.messages}), 400
