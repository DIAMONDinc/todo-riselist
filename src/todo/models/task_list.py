from datetime import datetime, timezone

from todo.extensions import db


class TaskList(db.Model):
    __tablename__ = "task_lists"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)

    # Внешний ключ на categories.id — какой категории принадлежит список
    # nullable=False — список не может существовать без категории
    category_id = db.Column(
        db.Integer,
        db.ForeignKey("categories.id"),
        nullable=False,
    )

    position = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Обратная связь: task_list.category вернёт объект Category
    category = db.relationship("Category", back_populates="lists")

    # Связь с задачами: task_list.tasks вернёт список Task
    # При удалении списка удалятся все его задачи (cascade)
    tasks = db.relationship(
        "Task",
        back_populates="task_list",
        cascade="all, delete-orphan",
        order_by="Task.position",
    )
