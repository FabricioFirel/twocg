"""
Carrega stations.csv e observations.csv no banco SQLite.

Uso (dentro da pasta backend):
    python manage.py load_csv
    python manage.py load_csv --dir ../data --clear
"""

import csv
import math
from datetime import datetime, timezone
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from hidro.models import Observation, Station

METRICAS_VALIDAS = {m.value for m in Observation.Metric}


def ler_valor(texto, metrica):
    """Converte o texto do CSV em número. Devolve None se for inválido."""
    try:
        valor = float(texto)
    except (TypeError, ValueError):
        return None
    if math.isnan(valor) or math.isinf(valor) or valor < 0:
        return None
    if metrica == Observation.Metric.RAIN and valor > 500:
        return None
    if metrica == Observation.Metric.LEVEL and valor > 100:
        return None
    return valor


def ler_data_utc(texto):
    momento = datetime.fromisoformat(texto.strip().replace("Z", "+00:00"))
    if momento.tzinfo is None:
        momento = momento.replace(tzinfo=timezone.utc)
    return momento.astimezone(timezone.utc)


class Command(BaseCommand):
    help = "Carrega stations.csv e observations.csv no banco de dados"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dir",
            default=str(Path(settings.BASE_DIR).parent / "data"),
            help="pasta onde estão os CSVs (padrão: ../data)",
        )
        parser.add_argument(
            "--clear", action="store_true", help="apaga os dados antes de carregar"
        )

    @transaction.atomic
    def handle(self, *args, **options):
        pasta = Path(options["dir"])
        arq_estacoes = pasta / "stations.csv"
        arq_leituras = pasta / "observations.csv"
        for arq in (arq_estacoes, arq_leituras):
            if not arq.exists():
                raise CommandError(f"Arquivo não encontrado: {arq}. Rode o seed.py antes.")

        if options["clear"]:
            Observation.objects.all().delete()
            Station.objects.all().delete()

        with open(arq_estacoes, encoding="utf-8") as f:
            for linha in csv.DictReader(f):
                Station.objects.update_or_create(
                    id=linha["id"].strip(),
                    defaults={
                        "name": linha["name"].strip(),
                        "river": linha["river"].strip(),
                        "city": linha["city"].strip(),
                        "state": linha["state"].strip(),
                        "latitude": float(linha["latitude"]),
                        "longitude": float(linha["longitude"]),
                        "alert_level_m": ler_valor(linha.get("alert_level_m"), None),
                    },
                )
        estacoes = set(Station.objects.values_list("id", flat=True))

        leituras = []
        invalidas = ignoradas = 0
        with open(arq_leituras, encoding="utf-8") as f:
            for linha in csv.DictReader(f):
                estacao = (linha.get("station_id") or "").strip()
                metrica = (linha.get("metric") or "").strip()
                if estacao not in estacoes or metrica not in METRICAS_VALIDAS:
                    ignoradas += 1
                    continue
                try:
                    momento = ler_data_utc(linha["observed_at"])
                except (KeyError, ValueError):
                    ignoradas += 1
                    continue
                valor = ler_valor(linha.get("value"), metrica)
                if valor is None:
                    invalidas += 1
                leituras.append(
                    Observation(
                        station_id=estacao, observed_at=momento, metric=metrica, value=valor
                    )
                )

        Observation.objects.bulk_create(
            leituras,
            batch_size=1000,
            update_conflicts=True,
            unique_fields=["station", "observed_at", "metric"],
            update_fields=["value"],
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"{len(estacoes)} estações e {len(leituras)} leituras carregadas "
                f"({invalidas} com valor inválido salvas como nulo, {ignoradas} linhas ignoradas)."
            )
        )
