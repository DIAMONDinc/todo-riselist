from datetime import datetime, timezone

from todo.extensions import db


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    position = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Связь с TaskList: category.lists вернёт список объектов TaskList
    # cascade="all, delete-orphan" — при удалении категории
    # автоматически удалятся все её списки (и их задачи — через свой cascade)
    # order_by="TaskList.position" — списки сортируются по position
    # back_populates — двусторонняя связь: на стороне TaskList будет .category
    lists = db.relationship(
        "TaskList",
        back_populates="category",
        cascade="all, delete-orphan",
        order_by="TaskList.position",
    )
