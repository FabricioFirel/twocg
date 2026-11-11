"""
Gerador de dados sintéticos do Desafio COGMO (adaptação do seed.js para Python puro).

Gera dois arquivos CSV nesta mesma pasta:

- stations.csv      -> as estações fictícias
- observations.csv  -> leituras de hora em hora de nível do rio (m) e chuva (mm/h)

Os dados são FICTÍCIOS e não servem para fins operacionais reais.

Uso: 
    python seed.py                 # 7 dias, terminando na hora cheia atual (UTC)
    python seed.py --days 3        # 3 dias de leituras
    python seed.py --seed 123      # outra semente aleatória
    python seed.py --end 2026-11-01T12:00:00Z

Só usa a biblioteca padrão do Python (não precisa instalar nada).
"""

import argparse
import csv
import math
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

PASTA = Path(__file__).resolve().parent

# Estações fictícias. A última não tem leituras, para testar a "série vazia" no front.
ESTACOES = [
    # id, nome, rio, município, UF, latitude, longitude, nível base (m), nível de alerta (m)
    ("EST-001", "Ponte Velha", "Rio Aurora", "Vale Verde", "MG", -19.912, -43.941, 2.10, 4.50),
    ("EST-002", "Cachoeira Alta", "Rio Aurora", "Serra Azul", "MG", -20.105, -44.002, 1.60, 3.80),
    ("EST-003", "Porto do Sol", "Rio Jaguará", "Campo Belo", "SP", -22.530, -47.110, 3.40, 6.00),
    ("EST-004", "Barra Mansa", "Rio Jaguará", "Lagoa Funda", "SP", -22.702, -47.380, 2.80, 5.20),
    ("EST-005", "Estação Nova", "Rio Cristal", "Pedra Branca", "PR", -25.430, -49.270, 1.20, 3.00),
]
ESTACAO_SEM_DADOS = "EST-005"

# Valores "estragados" que o gerador mistura de propósito nos dados,
# para que a carga e a API precisem tratar métricas inválidas.
VALORES_INVALIDOS = ["", "NaN", "-999", "erro"]
CHANCE_INVALIDO = 0.015


def gerar_chuva(rng, horas):
    """Chuva em mm/h: períodos secos com eventos de tempestade aleatórios."""
    chuva = []
    chovendo = 0  # horas restantes do evento atual
    intensidade = 0.0
    for _ in range(horas):
        if chovendo == 0 and rng.random() < 0.04:
            chovendo = rng.randint(2, 10)
            intensidade = rng.uniform(2, 25)
        if chovendo > 0:
            valor = max(0.0, rng.gauss(intensidade, intensidade * 0.35))
            chovendo -= 1
        else:
            valor = rng.choice([0.0] * 9 + [round(rng.uniform(0, 0.8), 1)])
        chuva.append(round(valor, 1))
    return chuva


def gerar_nivel(rng, chuva, base):
    """Nível em metros: sobe com a chuva (com atraso) e desce aos poucos."""
    nivel = []
    excesso = 0.0
    for i in range(len(chuva)):
        atrasada = chuva[i - 3] if i >= 3 else 0.0  # o rio responde ~3h depois
        excesso = excesso * 0.93 + atrasada * 0.035
        oscilacao = 0.03 * math.sin(i / 24 * 2 * math.pi)  # pequena variação diária
        valor = base + excesso + oscilacao + rng.gauss(0, 0.01)
        nivel.append(round(max(0.0, valor), 2))
    return nivel


def talvez_invalido(rng, valor):
    if rng.random() < CHANCE_INVALIDO:
        return rng.choice(VALORES_INVALIDOS)
    return valor


def formatar_utc(momento):
    return momento.strftime("%Y-%m-%dT%H:%M:%SZ")


def main():
    parser = argparse.ArgumentParser(description="Gera stations.csv e observations.csv")
    parser.add_argument("--days", type=int, default=7, help="dias de leituras (padrão 7)")
    parser.add_argument("--seed", type=int, default=42, help="semente aleatória (padrão 42)")
    parser.add_argument("--end", help="última hora em UTC, ex.: 2026-11-01T12:00:00Z")
    args = parser.parse_args()

    if args.end:
        fim = datetime.fromisoformat(args.end.replace("Z", "+00:00")).astimezone(timezone.utc)
    else:
        fim = datetime.now(timezone.utc)
    fim = fim.replace(minute=0, second=0, microsecond=0)

    horas = args.days * 24
    inicio = fim - timedelta(hours=horas - 1)
    rng = random.Random(args.seed)

    with open(PASTA / "stations.csv", "w", newline="", encoding="utf-8") as arquivo:
        escritor = csv.writer(arquivo)
        escritor.writerow(
            ["id", "name", "river", "city", "state", "latitude", "longitude", "alert_level_m"]
        )
        for est in ESTACOES:
            escritor.writerow([est[0], est[1], est[2], est[3], est[4], est[5], est[6], est[8]])

    total = 0
    with open(PASTA / "observations.csv", "w", newline="", encoding="utf-8") as arquivo:
        escritor = csv.writer(arquivo)
        escritor.writerow(["station_id", "observed_at", "metric", "value"])
        for est in ESTACOES:
            if est[0] == ESTACAO_SEM_DADOS:
                continue
            chuva = gerar_chuva(rng, horas)
            nivel = gerar_nivel(rng, chuva, est[7])
            for i in range(horas):
                momento = formatar_utc(inicio + timedelta(hours=i))
                escritor.writerow([est[0], momento, "level_m", talvez_invalido(rng, nivel[i])])
                escritor.writerow([est[0], momento, "rain_mm_h", talvez_invalido(rng, chuva[i])])
                total += 2

    print(f"stations.csv: {len(ESTACOES)} estações")
    print(f"observations.csv: {total} leituras de {formatar_utc(inicio)} a {formatar_utc(fim)}")


if __name__ == "__main__":
    main()
