"""add categories and task lists

Revision ID: 46e0443ca7ae
Revises: 286c7c44f7b2
Create Date: 2026-10-16 12:12:33.798234

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '46e0443ca7ae'
down_revision = '286c7c44f7b2'
branch_labels = None
depends_on = None


def upgrade():
    # Создаём таблицу категорий
    op.create_table('categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Создаём таблицу списков задач с внешним ключом на категории
    op.create_table('task_lists',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Изменяем существующую таблицу tasks:
    # batch_alter_table нужен для SQLite — Alembic пересоздаёт таблицу под капотом
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        # Добавляем колонку list_id (nullable=True, чтобы не сломать старые строки)
        batch_op.add_column(sa.Column('list_id', sa.Integer(), nullable=True))

        # Внешний ключ с ИМЕНЕМ — иначе SQLite не сможет его удалить в downgrade
        batch_op.create_foreign_key(
            'fk_tasks_list_id_task_lists',
            'task_lists', ['list_id'], ['id']
        )


def downgrade():
    # Откатываем изменения в tasks
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        # Удаляем внешний ключ по имени (оно должно совпадать с upgrade)
        batch_op.drop_constraint('fk_tasks_list_id_task_lists', type_='foreignkey')
        # Удаляем колонку list_id
        batch_op.drop_column('list_id')

    # Удаляем таблицы в обратном порядке (сначала зависимые)
    op.drop_table('task_lists')
    op.drop_table('categories')
