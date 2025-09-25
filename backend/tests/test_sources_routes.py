from __future__ import annotations

import pytest

from backend.app import create_app
from backend.services import connections


@pytest.fixture()
def client(monkeypatch):
    app = create_app({"TESTING": True})
    connections.connection_manager.reset()
    with app.test_client() as client:
        yield client
    connections.connection_manager.reset()


def test_connect_success(client, monkeypatch):
    def fake_test_connection(config):
        assert config.host == "db.example.com"

    def fake_register(config):
        return "abc123"

    monkeypatch.setattr(connections.connection_manager, "test_connection", fake_test_connection)
    monkeypatch.setattr(connections.connection_manager, "register", fake_register)

    response = client.post(
        "/api/sources/connect",
        json={
            "host": "db.example.com",
            "port": 5432,
            "database": "postgres",
            "user": "postgres",
            "password": "secret",
            "ssl": True,
        },
    )

    assert response.status_code == 200
    assert response.get_json() == {"connectionId": "abc123"}


def test_connect_missing_fields(client):
    response = client.post(
        "/api/sources/connect",
        json={"host": "db", "port": 5432},
    )

    assert response.status_code == 400
    body = response.get_json()
    assert "database" in body["error"]


def test_connect_invalid_credentials(client, monkeypatch):
    def fake_test_connection(config):
        raise connections.ConnectionValidationError("Invalid credentials")

    monkeypatch.setattr(connections.connection_manager, "test_connection", fake_test_connection)

    response = client.post(
        "/api/sources/connect",
        json={
            "host": "db.example.com",
            "port": 5432,
            "database": "postgres",
            "user": "postgres",
            "password": "secret",
        },
    )

    assert response.status_code == 400
    assert response.get_json() == {"error": "Invalid credentials"}


def test_get_schemas_success(client, monkeypatch):
    monkeypatch.setattr(connections.connection_manager, "list_schemas", lambda connection_id: ["public", "sales"])

    response = client.get("/api/sources/schemas?connectionId=abc123")

    assert response.status_code == 200
    assert response.get_json() == {"schemas": ["public", "sales"]}


def test_get_schemas_missing_connection_id(client):
    response = client.get("/api/sources/schemas")
    assert response.status_code == 400
    assert "connectionId" in response.get_json()["error"]


def test_get_tables_success(client, monkeypatch):
    monkeypatch.setattr(
        connections.connection_manager,
        "list_tables",
        lambda connection_id, schema: ["users", "orders"],
    )

    response = client.get("/api/sources/tables?connectionId=abc123&schema=public")

    assert response.status_code == 200
    assert response.get_json() == {"tables": ["users", "orders"]}


def test_get_tables_missing_parameters(client):
    response = client.get("/api/sources/tables?connectionId=abc123")
    assert response.status_code == 400
    assert "schema" in response.get_json()["error"]


def test_get_tables_not_found(client, monkeypatch):
    def raise_not_found(connection_id, schema):
        raise connections.ConnectionNotFoundError("Connection has expired or does not exist.")

    monkeypatch.setattr(connections.connection_manager, "list_tables", raise_not_found)

    response = client.get("/api/sources/tables?connectionId=abc123&schema=public")

    assert response.status_code == 404
    assert "expired" in response.get_json()["error"]
