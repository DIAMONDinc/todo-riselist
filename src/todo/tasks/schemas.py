from marshmallow import Schema, fields, validate


class TaskSchema(Schema):
    # dump_only=True — поле возвращается в ответе, но не принимается на входе
    id = fields.Int(dump_only=True)

    # required=True — при создании задачи title обязателен
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))

    # load_default="" — если description не передан, подставится пустая строка
    description = fields.Str(load_default="")

    # dump_only — статус меняется только через /toggle
    is_done = fields.Bool(dump_only=True)

    # dump_only — позиция вычисляется сервисом при создании
    position = fields.Int(dump_only=True)

    # list_id — к какому списку относится задача.
    # load_default=None, allow_none=True — пока задача может существовать без списка,
    # чтобы не сломать старые тесты. Позже сделаем обязательным.
    list_id = fields.Int(load_default=None, allow_none=True)

    created_at = fields.DateTime(dump_only=True)
