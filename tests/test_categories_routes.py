def test_create_category(client):
    """POST /categories/ создаёт категорию и возвращает 201."""
    response = client.post("/categories/", json={"name": "Работа"})
    assert response.status_code == 201
    data = response.get_json()
    assert data["name"] == "Работа"
    assert data["position"] == 1
    assert "id" in data


def test_create_category_without_name(client):
    """POST /categories/ без name возвращает 400."""
    response = client.post("/categories/", json={})
    assert response.status_code == 400


def test_list_categories(client):
    """GET /categories/ возвращает список категорий, отсортированных по position."""
    client.post("/categories/", json={"name": "Работа"})
    client.post("/categories/", json={"name": "Дом"})

    response = client.get("/categories/")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 2
    assert data[0]["name"] == "Работа"
    assert data[1]["name"] == "Дом"


def test_get_one_category(client):
    """GET /categories/<id> возвращает одну категорию."""
    response = client.post("/categories/", json={"name": "Работа"})
    cat_id = response.get_json()["id"]

    response = client.get(f"/categories/{cat_id}")
    assert response.status_code == 200
    assert response.get_json()["name"] == "Работа"


def test_get_missing_category(client):
    """GET /categories/999 возвращает 404."""
    response = client.get("/categories/999")
    assert response.status_code == 404
    assert response.get_json()["error"] == "Category not found"


def test_delete_category(client):
    """DELETE /categories/<id> удаляет и возвращает 204."""
    response = client.post("/categories/", json={"name": "Работа"})
    cat_id = response.get_json()["id"]

    response = client.delete(f"/categories/{cat_id}")
    assert response.status_code == 204

    response = client.get(f"/categories/{cat_id}")
    assert response.status_code == 404
