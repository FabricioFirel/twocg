# Cogmo — Sistema de Monitoramento Hidrológico

API REST em **Python** com **Django** e **Django REST Framework**, e front-end em **React** (Vite).

O projeto é a nossa adaptação do desafio proposto pela COGMO. O desafio original foi pensado para Node.js e, como estudo, foi reescrito para a stack Python no back-end.

## Sobre o projeto

O sistema reúne leituras de estações hidrológicas fictícias e as disponibiliza por uma API REST. Cada estação registra duas métricas, de hora em hora:

- **Nível do rio**, em metros (m)
- **Chuva**, em milímetros por hora (mm/h)

O front-end consome essa API e mostra, para a estação escolhida, o resumo das últimas leituras e gráficos independentes de nível e de chuva, com o histórico alternável entre 12, 24 e 48 horas.

### Aviso sobre os dados

Todos os dados são **sintéticos**, gerados por um script do próprio projeto, e as estações são **fictícias**. Nada aqui serve para fins operacionais, de alerta ou de tomada de decisão reais. Esse aviso também é exibido na interface.

## Estrutura de pastas

```
twocg/
├── data/                 # gerador e CSVs de dados sintéticos
│   ├── seed.py           # adaptação do seed.js para Python puro
│   ├── stations.csv
│   └── observations.csv
├── backend/              # projeto Django
│   ├── config/           # settings e urls
│   └── hidro/            # app: models, API, carga do CSV e testes
│       └── management/commands/load_csv.py
├── frontend/             # app React (Vite)
│   └── src/components/   # seletores, resumo, gráficos e estados da UI
├── docs/
│   ├── api.md            # contrato da API com exemplos
│   └── modelo-de-dados.md# MER e DER
└── requirements.txt
```

## Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| Python | 3.12+ | Linguagem do back-end |
| Django | 6.1 | Framework web |
| Django REST Framework | 3.18 | API REST |
| drf-spectacular | 0.30 | Documentação da API (OpenAPI / Swagger / Redoc) |
| django-cors-headers | 4.9 | Liberação de acesso para o front-end (CORS) |
| SQLite | — | Banco de dados de desenvolvimento |
| Node.js | 20+ | Ferramentas do front-end |
| React | 19 | Interface do usuário |
| Vite | 6 | Servidor de desenvolvimento e build do front |
| Recharts | 2 | Gráficos |

## Contrato da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/stations` | Lista as estações |
| `GET` | `/api/stations/{id}/summary` | Resumo das últimas leituras da estação |
| `GET` | `/api/stations/{id}/series?hours=24` | Série histórica, janela de 1 a 72 horas |

Regras de negócio:

- Todos os horários são tratados e devolvidos em **UTC** (ISO 8601 com `Z`).
- Métricas inválidas (vazio, `NaN`, negativo, texto) viram `null` na resposta, sem quebrar a série.
- `hours` fora de 1–72 devolve erro `400`; estação inexistente devolve `404`.
- As leituras vêm em ordem cronológica (`order=asc`, padrão) ou inversa (`order=desc`).

Detalhes e exemplos em [`docs/api.md`](docs/api.md). Modelo de dados em [`docs/modelo-de-dados.md`](docs/modelo-de-dados.md).

### Documentação automática

Com o servidor rodando:

| Endereço | Conteúdo |
|---|---|
| http://127.0.0.1:8000/api/docs/ | Swagger UI |
| http://127.0.0.1:8000/api/redoc/ | Redoc |
| http://127.0.0.1:8000/api/schema/ | Schema OpenAPI |

## Equipe e responsabilidades

| Integrante | Responsabilidade principal | Entregáveis |
|---|---|---|
| **Fabrício Alves** | Liderança técnica e desenvolvimento full-stack | Configuração do repositório, branches, `.gitignore` e dependências; README; revisão de *pull requests* e integração das entregas; script gerador dos dados sintéticos (`observations.csv`); integração da API com a documentação automática; tratamento dos estados da interface (carregamento, erro com nova tentativa e séries vazias) |
| **Elizete Ludmila** | Banco de dados e modelagem | Modelo de dados (MER e DER); models do Django e scripts de migração para o SQLite; carga inicial do banco a partir dos arquivos CSV |
| **Ana Beatriz Vieira** | Front-end (React) | Interface responsiva e acessível (celular e desktop); gráficos independentes de nível (m) e chuva (mm/h); seleção de estações, resumo das últimas leituras e alternância do histórico (12, 24 ou 48 horas) |
| **Claudiane Ribeiro** | Back-end (API REST) | Implementação das rotas do contrato; filtro da janela de 1 a 72 horas; regras de negócio (horários em UTC, tratamento de métricas inválidas e ordenação) |

## Pré-requisitos

- [Python 3.12 ou superior](https://www.python.org/downloads/)
- [Node.js 20 ou superior](https://nodejs.org/) (já vem com o `npm`)
- [Git](https://git-scm.com/)

## Como rodar o projeto

Você vai usar **dois terminais**: um para o back-end e outro para o front-end.

### 1. Clonar

```bash
git clone https://github.com/FabricioFirel/twocg.git
cd twocg
```

### 2. Back-end (terminal 1)

Crie e ative o ambiente virtual na raiz do projeto:

**Windows**
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux / macOS**
```bash
python3 -m venv venv
source venv/bin/activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

(Opcional) Gere dados novos, terminando na hora atual:

```bash
python data/seed.py
```

Entre na pasta do Django, crie o banco e carregue os CSVs:

```bash
cd backend
python manage.py migrate
python manage.py load_csv
```

Inicie o servidor:

```bash
python manage.py runserver
```

A API fica em http://127.0.0.1:8000/api/stations.

### 3. Front-end (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Abra http://localhost:5173. O Vite repassa as chamadas `/api` para o Django, então o back-end precisa estar rodando.

Se o Django estiver em outra porta (por exemplo `python manage.py runserver 8001`), crie o arquivo `frontend/.env.local` com esta linha e rode `npm run dev` de novo:

```
API_PROXY_TARGET=http://127.0.0.1:8001
```

## Gerador de dados (`data/seed.py`)

Adaptação do `seed.js` do desafio para Python puro (só biblioteca padrão). Gera 5 estações fictícias e 7 dias de leituras horárias:

- a chuva tem períodos secos e eventos de tempestade aleatórios;
- o nível do rio sobe cerca de 3 horas depois da chuva e desce aos poucos;
- cerca de 1,5% das leituras saem "estragadas" de propósito (vazio, `NaN`, `-999`, `erro`) para testar o tratamento de métricas inválidas;
- a estação `EST-005` não tem leituras, para testar a série vazia no front.

| Opção | Exemplo | Efeito |
|---|---|---|
| `--days` | `python data/seed.py --days 3` | quantidade de dias |
| `--seed` | `python data/seed.py --seed 7` | outra semente (dados diferentes) |
| `--end` | `python data/seed.py --end 2026-11-01T12:00:00Z` | última hora da série |

Depois de gerar de novo, recarregue o banco com `python manage.py load_csv --clear`.

## Testes

```bash
cd backend
python manage.py test
```

Os testes cobrem a lista de estações, a janela de 1 a 72 horas, a ordenação, as métricas inválidas, a série vazia e o resumo.

## Comandos úteis

| Comando | Descrição |
|---|---|
| `python manage.py load_csv --clear` | Apaga e recarrega os dados dos CSVs |
| `python manage.py createsuperuser` | Cria um usuário para o `/admin` |
| `python manage.py makemigrations` | Gera migrações após alterar os models |
| `python manage.py test` | Roda os testes do back-end |
| `npm run build` | Gera a versão final do front em `frontend/dist` |
| `npm run lint` | Verifica o código do front |

## Entregáveis do desafio

- [x] Código-fonte organizado em pastas limpas
- [x] Script Python gerador do `observations.csv` (`data/seed.py`)
- [x] Arquivo de dependências (`requirements.txt`) e scripts de migração (`backend/hidro/migrations`)
- [x] Documentação da API (Swagger/Redoc e `docs/api.md`) e do modelo de dados (`docs/modelo-de-dados.md`)
- [x] README detalhado
