def make_list(client, category_name="Работа", list_name="Срочное"):
    """Хелпер: создать категорию и список, вернуть list_id."""
    r = client.post("/categories/", json={"name": category_name})
    cat_id = r.get_json()["id"]
    r = client.post("/lists/", json={"name": list_name, "category_id": cat_id})
    return r.get_json()["id"]


def test_create_task_in_list(client):
    """POST /tasks/by-list/<id> создаёт задачу внутри списка."""
    list_id = make_list(client)

    response = client.post(
        f"/tasks/by-list/{list_id}",
        json={"title": "Buy milk", "description": "2 liters"},
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["title"] == "Buy milk"
    assert data["list_id"] == list_id
    assert data["position"] == 1


def test_list_tasks_by_list(client):
    """GET /tasks/by-list/<id> возвращает только задачи этого списка."""
    list1 = make_list(client, "Работа", "Срочное")
    list2 = make_list(client, "Дом", "Уборка")

    client.post(f"/tasks/by-list/{list1}", json={"title": "Task 1"})
    client.post(f"/tasks/by-list/{list1}", json={"title": "Task 2"})
    client.post(f"/tasks/by-list/{list2}", json={"title": "Task 3"})

    response = client.get(f"/tasks/by-list/{list1}")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 2
    titles = [t["title"] for t in data]
    assert "Task 1" in titles
    assert "Task 2" in titles
    assert "Task 3" not in titles


def test_create_task_in_missing_list(client):
    """POST /tasks/by-list/999 возвращает 404."""
    response = client.post(
        "/tasks/by-list/999",
        json={"title": "Buy milk"},
    )
    assert response.status_code == 404
    assert response.get_json()["error"] == "List not found"


def test_position_increments_within_list(client):
    """Позиция задачи считается в рамках своего списка."""
    list1 = make_list(client, "Работа", "Срочное")
    list2 = make_list(client, "Дом", "Уборка")

    r1 = client.post(f"/tasks/by-list/{list1}", json={"title": "A"})
    r2 = client.post(f"/tasks/by-list/{list1}", json={"title": "B"})
    r3 = client.post(f"/tasks/by-list/{list2}", json={"title": "C"})

    assert r1.get_json()["position"] == 1
    assert r2.get_json()["position"] == 2
    assert r3.get_json()["position"] == 1
