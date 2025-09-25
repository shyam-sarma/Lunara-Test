from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from typing import Dict
from uuid import uuid4

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine, URL
from sqlalchemy.exc import SQLAlchemyError, OperationalError


class ConnectionError(Exception):
    """Base exception for connection issues."""


class ConnectionValidationError(ConnectionError):
    """Raised when the provided connection details are invalid."""


class ConnectionNotFoundError(ConnectionError):
    """Raised when a connection identifier cannot be located."""


class MetadataRetrievalError(ConnectionError):
    """Raised when schema or table metadata cannot be fetched."""


@dataclass(frozen=True)
class ConnectionConfig:
    host: str
    port: int
    database: str
    user: str
    password: str
    ssl: bool


class ConnectionManager:
    """Manage PostgreSQL connections for the Flask service."""

    def __init__(self) -> None:
        self._connections: Dict[str, Dict[str, object]] = {}
        self._lock = Lock()

    def reset(self) -> None:
        """Reset the manager state. Intended for use in tests only."""

        with self._lock:
            for entry in self._connections.values():
                engine = entry.get("engine")
                if isinstance(engine, Engine):
                    engine.dispose()
            self._connections.clear()

    def test_connection(self, config: ConnectionConfig) -> None:
        """Validate that the provided configuration can reach the database."""

        engine = self._create_engine(config)
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
        except (OperationalError, SQLAlchemyError) as exc:  # pragma: no cover - exercised via integration
            raise ConnectionValidationError("Unable to connect to the database with the provided credentials.") from exc
        finally:
            engine.dispose()

    def register(self, config: ConnectionConfig) -> str:
        """Register a configuration and return a public connection identifier."""

        connection_id = uuid4().hex
        with self._lock:
            self._connections[connection_id] = {"config": config, "engine": None}
        return connection_id

    def list_schemas(self, connection_id: str) -> list[str]:
        """Return the list of schemas for the connection."""

        engine = self._get_engine(connection_id)
        query = text(
            """
            SELECT schema_name
            FROM information_schema.schemata
            WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
            ORDER BY schema_name
            """
        )
        try:
            with engine.connect() as connection:
                result = connection.execute(query)
                return [row.schema_name for row in result]
        except SQLAlchemyError as exc:  # pragma: no cover - executed in integration tests
            raise MetadataRetrievalError("Unable to load schemas from the database.") from exc

    def list_tables(self, connection_id: str, schema: str) -> list[str]:
        """Return the tables for a specific schema."""

        engine = self._get_engine(connection_id)
        query = text(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = :schema
            ORDER BY table_name
            """
        )
        try:
            with engine.connect() as connection:
                result = connection.execute(query, {"schema": schema})
                return [row.table_name for row in result]
        except SQLAlchemyError as exc:  # pragma: no cover - executed in integration tests
            raise MetadataRetrievalError("Unable to load tables for the requested schema.") from exc

    def _get_engine(self, connection_id: str) -> Engine:
        with self._lock:
            entry = self._connections.get(connection_id)
            if not entry:
                raise ConnectionNotFoundError("Connection has expired or does not exist.")

            engine = entry.get("engine")
            if isinstance(engine, Engine):
                return engine

            config = entry["config"]
            assert isinstance(config, ConnectionConfig)
            engine = self._create_engine(config)
            entry["engine"] = engine
            return engine

    def _create_engine(self, config: ConnectionConfig) -> Engine:
        url = URL.create(
            "postgresql+psycopg",
            username=config.user,
            password=config.password,
            host=config.host,
            port=config.port,
            database=config.database,
            query={"sslmode": "require" if config.ssl else "prefer"},
        )
        return create_engine(url, pool_pre_ping=True, future=True)


connection_manager = ConnectionManager()
