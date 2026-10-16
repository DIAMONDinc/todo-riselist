from marshmallow import Schema, fields, validate


class TaskListSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))

    # category_id — к какой категории относится список.
    # required=True — список не может существовать без категории.
    category_id = fields.Int(required=True)

    # position — вычисляется сервисом, не задаётся клиентом
    position = fields.Int(dump_only=True)

    created_at = fields.DateTime(dump_only=True)
