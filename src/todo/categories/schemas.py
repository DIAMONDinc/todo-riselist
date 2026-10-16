from marshmallow import Schema, fields, validate


class CategorySchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    position = fields.Int(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    # lists добавим позже, когда базовый CRUD заработает
