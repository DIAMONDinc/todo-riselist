import pytest

from todo.errors import TaskNotFound
from todo.tasks.services import create_task, delete_task, get_task, toggle_task


def test_create_task(app):
    task = create_task("Buy milk")
    assert task.id is not None
    assert task.title == "Buy milk"
    assert task.is_done is False


def test_toggle_task(app):
    task = create_task("Buy milk")
    toggled = toggle_task(task.id)
    assert toggled.is_done is True


def test_delete_task(app):
    task = create_task("Buy milk")
    delete_task(task.id)
    with pytest.raises(TaskNotFound):
        get_task(task.id)
