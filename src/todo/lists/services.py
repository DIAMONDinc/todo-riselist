from todo.errors import ListNotFound
from todo.extensions import db
from todo.models.task_list import TaskList


def list_lists(category_id: int | None = None):
    """Список списков. Если category_id передан — только списки этой категории."""
    query = TaskList.query
    if category_id is not None:
        query = query.filter(TaskList.category_id == category_id)
    return query.order_by(TaskList.position).all()


def create_list(name: str, category_id: int) -> TaskList:
    # Считаем max(position) только среди списков этой же категории
    max_pos = (
        db.session.query(db.func.max(TaskList.position))
        .filter(TaskList.category_id == category_id)
        .scalar()
        or 0
    )
    task_list = TaskList(
        name=name,
        category_id=category_id,
        position=max_pos + 1,
    )
    db.session.add(task_list)
    db.session.commit()
    return task_list


def get_list(list_id: int) -> TaskList:
    task_list = db.session.get(TaskList, list_id)
    if task_list is None:
        raise ListNotFound(list_id)
    return task_list


def delete_list(list_id: int) -> None:
    task_list = get_list(list_id)
    # Каскад "all, delete-orphan" в модели TaskList удалит все задачи этого списка
    db.session.delete(task_list)
    db.session.commit()
