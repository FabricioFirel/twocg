from rest_framework import serializers

from .models import Station


class StationSerializer(serializers.ModelSerializer):
    last_observation_at = serializers.DateTimeField(read_only=True, allow_null=True)

    class Meta:
        model = Station
        fields = [
            "id",
            "name",
            "river",
            "city",
            "state",
            "latitude",
            "longitude",
            "alert_level_m",
            "last_observation_at",
        ]


class ReadingSerializer(serializers.Serializer):
    value = serializers.FloatField(allow_null=True)
    observed_at = serializers.DateTimeField(allow_null=True)


class SummarySerializer(serializers.Serializer):
    station = StationSerializer()
    last_observation_at = serializers.DateTimeField(allow_null=True)
    level_m = ReadingSerializer()
    rain_mm_h = ReadingSerializer()
    rain_24h_mm = serializers.FloatField(allow_null=True)
    level_trend = serializers.ChoiceField(
        choices=["subindo", "descendo", "estavel"], allow_null=True
    )
    status = serializers.ChoiceField(choices=["normal", "atencao", "alerta", "sem_dados"])
    invalid_readings_24h = serializers.IntegerField()


class SeriesPointSerializer(serializers.Serializer):
    observed_at = serializers.DateTimeField()
    level_m = serializers.FloatField(allow_null=True, required=False)
    rain_mm_h = serializers.FloatField(allow_null=True, required=False)


class SeriesSerializer(serializers.Serializer):
    station_id = serializers.CharField()
    hours = serializers.IntegerField()
    metric = serializers.CharField()
    order = serializers.CharField()
    start = serializers.DateTimeField(allow_null=True)
    end = serializers.DateTimeField(allow_null=True)
    count = serializers.IntegerField()
    points = SeriesPointSerializer(many=True)


class SeriesQuerySerializer(serializers.Serializer):
    """Valida os parâmetros de /series."""

    hours = serializers.IntegerField(
        min_value=1, max_value=72, default=24, help_text="Janela em horas (1 a 72)"
    )
    metric = serializers.ChoiceField(
        choices=["all", "level_m", "rain_mm_h"],
        default="all",
        help_text="Qual métrica devolver",
    )
    order = serializers.ChoiceField(
        choices=["asc", "desc"], default="asc", help_text="Ordem cronológica"
    )
