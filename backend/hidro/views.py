from datetime import timedelta

from django.db.models import Max
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Observation, Station
from .serializers import (
    SeriesQuerySerializer,
    SeriesSerializer,
    StationSerializer,
    SummarySerializer,
)

LEVEL = Observation.Metric.LEVEL
RAIN = Observation.Metric.RAIN


def estacoes_com_ultima_leitura():
    return Station.objects.annotate(last_observation_at=Max("observations__observed_at"))


def ultima_valida(estacao, metrica, ate):
    """Última leitura com valor válido (não nulo) de uma métrica."""
    return (
        Observation.objects.filter(
            station=estacao, metric=metrica, observed_at__lte=ate, value__isnull=False
        )
        .order_by("-observed_at")
        .first()
    )


class StationListView(APIView):
    @extend_schema(
        summary="Lista as estações",
        responses=StationSerializer(many=True),
        tags=["estações"],
    )
    def get(self, request):
        estacoes = estacoes_com_ultima_leitura()
        return Response(StationSerializer(estacoes, many=True).data)


class StationSummaryView(APIView):
    @extend_schema(
        summary="Resumo das últimas leituras da estação",
        responses=SummarySerializer,
        tags=["estações"],
    )
    def get(self, request, station_id):
        estacao = get_object_or_404(estacoes_com_ultima_leitura(), pk=station_id)
        fim = estacao.last_observation_at
        vazio = {"value": None, "observed_at": None}

        if fim is None:
            return Response(
                SummarySerializer(
                    {
                        "station": estacao,
                        "last_observation_at": None,
                        "level_m": vazio,
                        "rain_mm_h": vazio,
                        "rain_24h_mm": None,
                        "level_trend": None,
                        "status": "sem_dados",
                        "invalid_readings_24h": 0,
                    }
                ).data
            )

        nivel = ultima_valida(estacao, LEVEL, fim)
        chuva = ultima_valida(estacao, RAIN, fim)

        inicio_24h = fim - timedelta(hours=23)
        ultimas_24h = Observation.objects.filter(
            station=estacao, observed_at__gte=inicio_24h, observed_at__lte=fim
        )
        chuvas = list(
            ultimas_24h.filter(metric=RAIN, value__isnull=False).values_list("value", flat=True)
        )
        chuva_24h = round(sum(chuvas), 1) if chuvas else None
        invalidas = ultimas_24h.filter(value__isnull=True).count()

        # Tendência: compara o nível atual com o de 3 horas antes.
        tendencia = None
        if nivel:
            anterior = ultima_valida(estacao, LEVEL, nivel.observed_at - timedelta(hours=3))
            if anterior:
                diferenca = nivel.value - anterior.value
                if diferenca > 0.05:
                    tendencia = "subindo"
                elif diferenca < -0.05:
                    tendencia = "descendo"
                else:
                    tendencia = "estavel"

        status = "sem_dados"
        if nivel:
            status = "normal"
            if estacao.alert_level_m:
                if nivel.value >= estacao.alert_level_m:
                    status = "alerta"
                elif nivel.value >= estacao.alert_level_m * 0.8:
                    status = "atencao"

        def leitura(obs):
            return {"value": obs.value, "observed_at": obs.observed_at} if obs else vazio

        dados = {
            "station": estacao,
            "last_observation_at": fim,
            "level_m": leitura(nivel),
            "rain_mm_h": leitura(chuva),
            "rain_24h_mm": chuva_24h,
            "level_trend": tendencia,
            "status": status,
            "invalid_readings_24h": invalidas,
        }
        return Response(SummarySerializer(dados).data)


class StationSeriesView(APIView):
    @extend_schema(
        summary="Série histórica da estação (janela de 1 a 72 horas)",
        description=(
            "A janela termina na última leitura da estação e volta `hours` horas. "
            "Horários em UTC (ISO 8601 com Z). Leituras inválidas vêm como null."
        ),
        parameters=[
            OpenApiParameter("hours", int, description="1 a 72 (padrão 24)"),
            OpenApiParameter("metric", str, enum=["all", "level_m", "rain_mm_h"]),
            OpenApiParameter("order", str, enum=["asc", "desc"]),
        ],
        responses=SeriesSerializer,
        tags=["estações"],
    )
    def get(self, request, station_id):
        estacao = get_object_or_404(estacoes_com_ultima_leitura(), pk=station_id)
        consulta = SeriesQuerySerializer(data=request.query_params)
        consulta.is_valid(raise_exception=True)
        horas = consulta.validated_data["hours"]
        metrica = consulta.validated_data["metric"]
        ordem = consulta.validated_data["order"]

        fim = estacao.last_observation_at
        inicio = fim - timedelta(hours=horas - 1) if fim else None
        metricas = [LEVEL, RAIN] if metrica == "all" else [metrica]

        pontos = {}
        if fim:
            leituras = Observation.objects.filter(
                station=estacao,
                observed_at__gte=inicio,
                observed_at__lte=fim,
                metric__in=metricas,
            ).values_list("observed_at", "metric", "value")
            for momento, nome, valor in leituras:
                ponto = pontos.setdefault(
                    momento, {"observed_at": momento, **{m: None for m in metricas}}
                )
                ponto[nome] = valor

        lista = sorted(pontos.values(), key=lambda p: p["observed_at"], reverse=ordem == "desc")
        dados = {
            "station_id": estacao.id,
            "hours": horas,
            "metric": metrica,
            "order": ordem,
            "start": inicio,
            "end": fim,
            "count": len(lista),
            "points": lista,
        }
        saida = SeriesSerializer(dados).data
        if metrica != "all":  # devolve só a métrica pedida
            for ponto in saida["points"]:
                ponto.pop(LEVEL if metrica == RAIN else RAIN, None)
        return Response(saida)
