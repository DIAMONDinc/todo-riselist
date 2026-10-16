def make_category(client, name="Работа"):
    """Хелпер: создать категорию и вернуть её id."""
    response = client.post("/categories/", json={"name": name})
    return response.get_json()["id"]


def test_create_list(client):
    """POST /lists/ создаёт список внутри категории."""
    cat_id = make_category(client)

    response = client.post("/lists/", json={"name": "Срочное", "category_id": cat_id})
    assert response.status_code == 201
    data = response.get_json()
    assert data["name"] == "Срочное"
    assert data["category_id"] == cat_id
    assert data["position"] == 1


def test_create_list_without_category(client):
    """POST /lists/ без category_id возвращает 400."""
    response = client.post("/lists/", json={"name": "Срочное"})
    assert response.status_code == 400


def test_list_all_lists(client):
    """GET /lists/ возвращает все списки."""
    cat_id = make_category(client)
    client.post("/lists/", json={"name": "Срочное", "category_id": cat_id})
    client.post("/lists/", json={"name": "Позже", "category_id": cat_id})

    response = client.get("/lists/")
    assert response.status_code == 200
    assert len(response.get_json()) == 2


def test_filter_lists_by_category(client):
    """GET /lists/?category_id=X возвращает только списки этой категории."""
    cat1 = make_category(client, "Работа")
    cat2 = make_category(client, "Дом")

    client.post("/lists/", json={"name": "Срочное", "category_id": cat1})
    client.post("/lists/", json={"name": "Уборка", "category_id": cat2})

    response = client.get(f"/lists/?category_id={cat1}")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["name"] == "Срочное"


def test_get_missing_list(client):
    """GET /lists/999 возвращает 404."""
    response = client.get("/lists/999")
    assert response.status_code == 404
    assert response.get_json()["error"] == "List not found"


def test_delete_list(client):
    """DELETE /lists/<id> удаляет список."""
    cat_id = make_category(client)
    response = client.post("/lists/", json={"name": "Срочное", "category_id": cat_id})
    list_id = response.get_json()["id"]

    response = client.delete(f"/lists/{list_id}")
    assert response.status_code == 204

    response = client.get(f"/lists/{list_id}")
    assert response.status_code == 404
