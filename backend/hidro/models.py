from django.db import models


class Station(models.Model):
    """Estação hidrológica fictícia."""

    id = models.CharField("código", max_length=20, primary_key=True)
    name = models.CharField("nome", max_length=100)
    river = models.CharField("rio", max_length=100)
    city = models.CharField("município", max_length=100)
    state = models.CharField("UF", max_length=2)
    latitude = models.FloatField()
    longitude = models.FloatField()
    alert_level_m = models.FloatField("nível de alerta (m)", null=True, blank=True)

    class Meta:
        ordering = ["id"]
        verbose_name = "estação"
        verbose_name_plural = "estações"

    def __str__(self):
        return f"{self.id} - {self.name}"


class Observation(models.Model):
    """Uma leitura de uma métrica (nível ou chuva) em uma hora, sempre em UTC."""

    class Metric(models.TextChoices):
        LEVEL = "level_m", "Nível do rio (m)"
        RAIN = "rain_mm_h", "Chuva (mm/h)"

    station = models.ForeignKey(
        Station, on_delete=models.CASCADE, related_name="observations"
    )
    observed_at = models.DateTimeField("data/hora (UTC)", db_index=True)
    metric = models.CharField("métrica", max_length=20, choices=Metric.choices)
    # Valor nulo = leitura inválida ou ausente no CSV (não quebra a série).
    value = models.FloatField("valor", null=True, blank=True)

    class Meta:
        ordering = ["observed_at", "metric"]
        verbose_name = "leitura"
        verbose_name_plural = "leituras"
        constraints = [
            models.UniqueConstraint(
                fields=["station", "observed_at", "metric"], name="leitura_unica"
            )
        ]
        indexes = [models.Index(fields=["station", "observed_at"])]

    def __str__(self):
        return f"{self.station_id} {self.observed_at:%Y-%m-%d %H:%M} {self.metric}={self.value}"
