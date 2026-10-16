from todo.extensions import db
from todo.models.task import Task


def test_delete_category_cascades_to_lists(client):
    """При удалении категории удаляются все её списки."""
    response = client.post("/categories/", json={"name": "Работа"})
    cat_id = response.get_json()["id"]

    r1 = client.post("/lists/", json={"name": "Срочное", "category_id": cat_id})
    r2 = client.post("/lists/", json={"name": "Позже", "category_id": cat_id})
    list1_id = r1.get_json()["id"]
    list2_id = r2.get_json()["id"]

    client.delete(f"/categories/{cat_id}")

    assert client.get(f"/lists/{list1_id}").status_code == 404
    assert client.get(f"/lists/{list2_id}").status_code == 404


def test_delete_list_cascades_to_tasks(client, app):
    """При удалении списка удаляются все его задачи."""
    response = client.post("/categories/", json={"name": "Работа"})
    cat_id = response.get_json()["id"]
    response = client.post("/lists/", json={"name": "Срочное", "category_id": cat_id})
    list_id = response.get_json()["id"]

    # Создаём задачу через сервис (API задач ещё не привязан к спискам)
    from todo.tasks.services import create_task

    with app.app_context():
        task = create_task("Buy milk")
        task.list_id = list_id
        db.session.commit()
        task_id = task.id

    client.delete(f"/lists/{list_id}")

    with app.app_context():
        assert db.session.get(Task, task_id) is None
