from todo.errors import TaskNotFound
from todo.extensions import db
from todo.models.task import Task


def list_tasks(list_id: int | None = None):
    """
    Список задач.
    Если list_id передан — только задачи этого списка.
    Если нет — все задачи (для обратной совместимости со старым API).
    """
    query = Task.query
    if list_id is not None:
        query = query.filter(Task.list_id == list_id)
    return query.order_by(Task.position, Task.created_at.desc()).all()


def create_task(title: str, description: str = "", list_id: int | None = None) -> Task:
    """
    Создать задачу.
    Если list_id передан — привязать задачу к этому списку.
    Позиция считается в рамках списка (или глобально, если list_id не передан).
    """
    if list_id is not None:
        max_pos = (
            db.session.query(db.func.max(Task.position))
            .filter(Task.list_id == list_id)
            .scalar()
            or 0
        )
    else:
        max_pos = (
            db.session.query(db.func.max(Task.position))
            .filter(Task.list_id.is_(None))
            .scalar()
            or 0
        )

    task = Task(
        title=title,
        description=description,
        list_id=list_id,
        position=max_pos + 1,
    )
    db.session.add(task)
    db.session.commit()
    return task


def get_task(task_id: int) -> Task:
    task = db.session.get(Task, task_id)
    if task is None:
        raise TaskNotFound(task_id)
    return task


def toggle_task(task_id: int) -> Task:
    task = get_task(task_id)
    task.is_done = not task.is_done
    db.session.commit()
    return task


def delete_task(task_id: int) -> None:
    task = get_task(task_id)
    db.session.delete(task)
    db.session.commit()


def reorder_tasks(task_ids: list[int]) -> None:
    for index, task_id in enumerate(task_ids):
        task = get_task(task_id)
        task.position = index
    db.session.commit()
