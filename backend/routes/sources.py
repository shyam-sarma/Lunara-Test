from __future__ import annotations

from http import HTTPStatus

from flask import Blueprint, jsonify, request

from ..services.connections import (
    ConnectionConfig,
    ConnectionManager,
    ConnectionNotFoundError,
    ConnectionValidationError,
    MetadataRetrievalError,
    connection_manager,
)

bp = Blueprint("sources", __name__)


def _manager() -> ConnectionManager:
    return connection_manager


@bp.post("/connect")
def connect() -> tuple[object, int]:
    payload = request.get_json(silent=True) or {}

    required_fields = ["host", "port", "database", "user", "password"]
    missing = [field for field in required_fields if not payload.get(field)]
    if missing:
        message = f"Missing required field(s): {', '.join(missing)}"
        return jsonify({"error": message}), HTTPStatus.BAD_REQUEST

    try:
        port = int(payload["port"])
    except (ValueError, TypeError):
        return jsonify({"error": "Port must be a valid integer."}), HTTPStatus.BAD_REQUEST

    config = ConnectionConfig(
        host=payload["host"],
        port=port,
        database=payload["database"],
        user=payload["user"],
        password=payload["password"],
        ssl=bool(payload.get("ssl", False)),
    )

    try:
        _manager().test_connection(config)
    except ConnectionValidationError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    connection_id = _manager().register(config)
    return jsonify({"connectionId": connection_id}), HTTPStatus.OK


@bp.get("/schemas")
def get_schemas() -> tuple[object, int]:
    connection_id = request.args.get("connectionId")
    if not connection_id:
        return jsonify({"error": "A connectionId query parameter is required."}), HTTPStatus.BAD_REQUEST

    try:
        schemas = _manager().list_schemas(connection_id)
    except ConnectionNotFoundError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.NOT_FOUND
    except MetadataRetrievalError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.INTERNAL_SERVER_ERROR

    return jsonify({"schemas": schemas}), HTTPStatus.OK


@bp.get("/tables")
def get_tables() -> tuple[object, int]:
    connection_id = request.args.get("connectionId")
    schema = request.args.get("schema")

    if not connection_id or not schema:
        return jsonify({"error": "Both connectionId and schema query parameters are required."}), HTTPStatus.BAD_REQUEST

    try:
        tables = _manager().list_tables(connection_id, schema)
    except ConnectionNotFoundError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.NOT_FOUND
    except MetadataRetrievalError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.INTERNAL_SERVER_ERROR

    return jsonify({"tables": tables}), HTTPStatus.OK
