def test_create_and_list_tasks(client):
    response = client.post("/tasks/", json={"title": "Buy milk"})
    assert response.status_code == 201

    response = client.get("/tasks/")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["title"] == "Buy milk"


def test_toggle_task(client):
    response = client.post("/tasks/", json={"title": "Buy milk"})
    task_id = response.get_json()["id"]

    response = client.patch(f"/tasks/{task_id}/toggle")
    assert response.status_code == 200
    assert response.get_json()["is_done"] is True


def test_delete_task(client):
    response = client.post("/tasks/", json={"title": "Buy milk"})
    task_id = response.get_json()["id"]

    response = client.delete(f"/tasks/{task_id}")
    assert response.status_code == 204

    response = client.get("/tasks/")
    assert response.get_json() == []
