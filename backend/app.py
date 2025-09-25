from __future__ import annotations

from flask import Flask
from flask_cors import CORS


def create_app(config: dict | None = None) -> Flask:
    """Application factory for the Lunara backend service."""

    app = Flask(__name__)
    app.config.from_mapping({
        "JSON_SORT_KEYS": False,
    })

    if config:
        app.config.update(config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    from .routes.sources import bp as sources_bp  # noqa: WPS433 (import within function)

    app.register_blueprint(sources_bp, url_prefix="/api/sources")

    @app.get("/health")
    def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    return app


if __name__ == "__main__":  # pragma: no cover - convenience entrypoint
    create_app().run(host="0.0.0.0", port=5001, debug=True)
