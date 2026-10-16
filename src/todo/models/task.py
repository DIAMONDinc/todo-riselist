from datetime import datetime, timezone

from todo.extensions import db


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, default="")
    is_done = db.Column(db.Boolean, default=False, nullable=False)
    position = db.Column(db.Integer, default=0, nullable=False)

    # Внешний ключ на task_lists.id — к какому списку относится задача
    # nullable=True — ВРЕМЕННО, чтобы не сломать старые тесты и БД.
    # После обновления API сделаем nullable=False отдельной миграцией.
    list_id = db.Column(
        db.Integer,
        db.ForeignKey("task_lists.id"),
        nullable=True,
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Обратная связь: task.task_list вернёт объект TaskList
    task_list = db.relationship("TaskList", back_populates="tasks")
