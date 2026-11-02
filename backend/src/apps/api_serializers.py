from rest_framework import serializers


class StrictSerializerMixin:
    def to_internal_value(self, data):
        if hasattr(data, 'keys'):
            unknown_fields = set(data) - set(self.fields)
            if unknown_fields:
                raise serializers.ValidationError(
                    {
                        'non_field_errors': [
                            'Unknown fields: '
                            + ', '.join(sorted(unknown_fields))
                        ]
                    }
                )
        return super().to_internal_value(data)


class StrictSerializer(StrictSerializerMixin, serializers.Serializer):
    pass


class StrictModelSerializer(
    StrictSerializerMixin,
    serializers.ModelSerializer,
):
    pass


def parse_positive_integer(value, field_name):
    if value is None:
        return None
    try:
        parsed = int(value)
    except (TypeError, ValueError) as exc:
        raise serializers.ValidationError(
            {field_name: 'Must be a positive integer.'}
        ) from exc
    if parsed < 1:
        raise serializers.ValidationError(
            {field_name: 'Must be a positive integer.'}
        )
    return parsed
