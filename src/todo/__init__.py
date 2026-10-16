from flask import Flask

from todo.config import Config
from todo.extensions import db, migrate
from todo.errors import register_error_handlers
from todo.tasks.routes import tasks_bp


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    db.init_app(app)
    migrate.init_app(app, db)

    register_error_handlers(app)

    app.register_blueprint(tasks_bp, url_prefix="/tasks")

    return app
