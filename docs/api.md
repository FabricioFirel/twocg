# Contrato da API

Base: `http://127.0.0.1:8000/api`. Todas as datas são **UTC**, no formato ISO 8601 com `Z`
(ex.: `2026-11-03T18:00:00Z`). A documentação interativa fica em `/api/docs/` (Swagger) e
`/api/redoc/` (Redoc).

## GET /api/stations

Lista as estações, em ordem de código.

```json
[
  {
    "id": "EST-001",
    "name": "Ponte Velha",
    "river": "Rio Aurora",
    "city": "Vale Verde",
    "state": "MG",
    "latitude": -19.912,
    "longitude": -43.941,
    "alert_level_m": 4.5,
    "last_observation_at": "2026-11-03T18:00:00Z"
  }
]
```

`last_observation_at` é `null` quando a estação não tem leituras.

## GET /api/stations/{id}/summary

Resumo das últimas leituras. Se a leitura mais recente de uma métrica for inválida, vem a última válida.

```json
{
  "station": { "...": "mesmos campos de /stations" },
  "last_observation_at": "2026-11-03T18:00:00Z",
  "level_m": { "value": 2.56, "observed_at": "2026-11-03T17:00:00Z" },
  "rain_mm_h": { "value": 0.0, "observed_at": "2026-11-03T18:00:00Z" },
  "rain_24h_mm": 1.1,
  "level_trend": "descendo",
  "status": "normal",
  "invalid_readings_24h": 1
}
```

- `level_trend`: `subindo`, `descendo` ou `estavel` (compara com 3 horas antes; variação maior que 5 cm).
- `status`: `normal`, `atencao` (a partir de 80% do nível de alerta), `alerta` (acima do nível de alerta) ou `sem_dados`.

## GET /api/stations/{id}/series

| parâmetro | valores | padrão |
|---|---|---|
| `hours` | inteiro de **1 a 72** | 24 |
| `metric` | `all`, `level_m`, `rain_mm_h` | `all` |
| `order` | `asc` (mais antiga primeiro) ou `desc` | `asc` |

A janela termina na **última leitura da estação** e volta `hours` horas (como os dados são
sintéticos, isso evita série vazia só porque o seed foi rodado em outro dia).

```json
{
  "station_id": "EST-001",
  "hours": 24,
  "metric": "all",
  "order": "asc",
  "start": "2026-11-02T19:00:00Z",
  "end": "2026-11-03T18:00:00Z",
  "count": 24,
  "points": [
    { "observed_at": "2026-11-02T19:00:00Z", "level_m": 4.41, "rain_mm_h": 0.0 },
    { "observed_at": "2026-11-02T20:00:00Z", "level_m": null, "rain_mm_h": 0.0 }
  ]
}
```

- Leitura inválida vem como `null` no ponto, sem remover a hora da série.
- Estação sem leituras: `200` com `"points": []`.

## Erros

| situação | resposta |
|---|---|
| estação não existe | `404` `{"detail": "No Station matches the given query."}` |
| `hours` fora de 1–72 ou não numérico | `400` `{"hours": ["..."]}` |
| `metric` ou `order` inválidos | `400` com o campo e a mensagem |
