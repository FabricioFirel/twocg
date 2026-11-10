from datetime import datetime, timedelta, timezone

from django.test import TestCase
from rest_framework.test import APIClient

from .management.commands.load_csv import ler_valor
from .models import Observation, Station

FIM = datetime(2026, 11, 1, 12, tzinfo=timezone.utc)


class ApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.estacao = Station.objects.create(
            id="T-1", name="Teste", river="Rio", city="Cidade", state="MG",
            latitude=0, longitude=0, alert_level_m=5.0,
        )
        Station.objects.create(
            id="T-2", name="Vazia", river="Rio", city="Cidade", state="MG",
            latitude=0, longitude=0,
        )
        leituras = []
        for i in range(80):  # 80 horas de dados
            momento = FIM - timedelta(hours=i)
            leituras.append(Observation(station=cls.estacao, observed_at=momento,
                                        metric="level_m", value=2.0 + i * 0.01))
            leituras.append(Observation(station=cls.estacao, observed_at=momento,
                                        metric="rain_mm_h", value=None if i == 0 else 1.0))
        Observation.objects.bulk_create(leituras)

    def setUp(self):
        self.client = APIClient()

    def test_lista_estacoes(self):
        r = self.client.get("/api/stations")
        self.assertEqual(r.status_code, 200)
        self.assertEqual([e["id"] for e in r.json()], ["T-1", "T-2"])
        self.assertEqual(r.json()[0]["last_observation_at"], "2026-11-01T12:00:00Z")
        self.assertIsNone(r.json()[1]["last_observation_at"])

    def test_series_padrao_24h_em_ordem(self):
        r = self.client.get("/api/stations/T-1/series")
        dados = r.json()
        self.assertEqual(r.status_code, 200)
        self.assertEqual(dados["count"], 24)
        horas = [p["observed_at"] for p in dados["points"]]
        self.assertEqual(horas, sorted(horas))
        self.assertTrue(horas[-1].endswith("Z"))
        self.assertIsNone(dados["points"][-1]["rain_mm_h"])  # inválida vira null

    def test_series_desc_e_metrica(self):
        r = self.client.get("/api/stations/T-1/series?hours=12&order=desc&metric=level_m")
        dados = r.json()
        self.assertEqual(dados["count"], 12)
        self.assertNotIn("rain_mm_h", dados["points"][0])
        horas = [p["observed_at"] for p in dados["points"]]
        self.assertEqual(horas, sorted(horas, reverse=True))

    def test_series_limites_da_janela(self):
        self.assertEqual(self.client.get("/api/stations/T-1/series?hours=72").json()["count"], 72)
        self.assertEqual(self.client.get("/api/stations/T-1/series?hours=1").json()["count"], 1)
        for ruim in ["0", "73", "abc"]:
            r = self.client.get(f"/api/stations/T-1/series?hours={ruim}")
            self.assertEqual(r.status_code, 400, ruim)

    def test_series_metrica_invalida(self):
        r = self.client.get("/api/stations/T-1/series?metric=temperatura")
        self.assertEqual(r.status_code, 400)

    def test_series_vazia_e_estacao_inexistente(self):
        r = self.client.get("/api/stations/T-2/series")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["points"], [])
        self.assertEqual(self.client.get("/api/stations/XYZ/series").status_code, 404)

    def test_summary(self):
        dados = self.client.get("/api/stations/T-1/summary").json()
        self.assertEqual(dados["level_m"]["value"], 2.0)
        # A chuva da última hora é inválida, então vem a anterior válida.
        self.assertEqual(dados["rain_mm_h"]["observed_at"], "2026-11-01T11:00:00Z")
        self.assertEqual(dados["rain_24h_mm"], 23.0)
        self.assertEqual(dados["invalid_readings_24h"], 1)
        self.assertEqual(dados["level_trend"], "estavel")
        self.assertEqual(dados["status"], "normal")

    def test_summary_sem_dados(self):
        dados = self.client.get("/api/stations/T-2/summary").json()
        self.assertEqual(dados["status"], "sem_dados")


class CargaTests(TestCase):
    def test_valores_invalidos(self):
        for ruim in ["", "NaN", "-999", "erro", None, "inf"]:
            self.assertIsNone(ler_valor(ruim, "level_m"), ruim)
        self.assertEqual(ler_valor("2.5", "level_m"), 2.5)
