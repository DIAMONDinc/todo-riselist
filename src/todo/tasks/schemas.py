from marshmallow import Schema, fields, validate


class TaskSchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    description = fields.Str(load_default="")
    is_done = fields.Bool(dump_only=True)
    position = fields.Int(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
