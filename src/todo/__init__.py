from flask import Flask, render_template

from todo.categories.routes import categories_bp
from todo.config import Config
from todo.errors import register_error_handlers
from todo.extensions import db, migrate
from todo.lists.routes import lists_bp
from todo.tasks.routes import tasks_bp


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    # Инициализируем расширения с приложением
    db.init_app(app)
    migrate.init_app(app, db)

    # Регистрируем обработчики ошибок (404, 400 и т.д.)
    register_error_handlers(app)

    # === API Blueprints ===
    app.register_blueprint(tasks_bp, url_prefix="/tasks")
    app.register_blueprint(categories_bp, url_prefix="/categories")
    app.register_blueprint(lists_bp, url_prefix="/lists")

    # === HTML-страницы ===
    @app.get("/")
    def index():
        """Главная страница — доска с категориями и задачами."""
        return render_template("tasks/board.html")

    return app
