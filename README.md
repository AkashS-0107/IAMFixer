# IAMFixer

**Evidence-backed incident investigation and root-cause analysis for modern applications.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-iamfixer.vercel.app-0A66C2?style=for-the-badge)](https://iamfixer.vercel.app) [![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/) [![FastAPI](https://img.shields.io/badge/FastAPI-API-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/) [![React](https://img.shields.io/badge/React-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/) [![AWS Bedrock](https://img.shields.io/badge/Amazon-Bedrock-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/bedrock/)

IAMFixer helps engineers investigate application incidents by bringing incident context, telemetry, and supporting evidence into one workflow. It combines **Amazon Bedrock-powered analysis** with a deterministic rule-based fallback, structured result validation, and evidence traceability so that diagnoses can be inspected instead of blindly trusted.

> **Human-in-the-loop by design:** IAMFixer recommends remediation. It does not automatically modify infrastructure, restart services, change deployments, or execute remediation commands.

## Contents

- [Why IAMFixer?](#why-iamfixer)
- [Features](#features)
- [Investigation workflow](#investigation-workflow)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Run locally](#run-locally)
- [Configuration](#configuration)
- [Tests and build](#tests-and-build)
- [Deployment notes](#deployment-notes)
- [Security](#security)
- [Project structure](#project-structure)

## Why IAMFixer?

Production incidents rarely announce their root cause politely. Engineers often need to correlate service symptoms, telemetry, and deployment context before they can decide what to do next. IAMFixer provides a focused investigation workflow that produces a structured diagnosis, confidence information, evidence references, and remediation recommendations for human review.

## Features

- **AI-assisted root-cause analysis:** Uses Amazon Bedrock to analyze incident context and available telemetry.
- **Deterministic fallback:** Offers a rule-based RCA provider when configured to fall back from Bedrock or when running without live model calls.
- **Provider modes:** `bedrock` for Bedrock, `baseline` for deterministic analysis, and `auto` for Bedrock with baseline fallback.
- **Evidence traceability:** RCA evidence references link findings back to relevant telemetry events in the investigation UI.
- **Incident simulation lab:** Reproducible scenarios help demonstrate and test investigation flows without causing a real outage.
- **Structured validation:** Pydantic schemas and evidence checks validate model output before it is shown as an investigation result.
- **Human-reviewed remediation:** Recommendations are presented for review; the system does not execute infrastructure changes automatically.
- **Full-stack interface:** A React and TypeScript UI with an operations dashboard, incident investigation view, and simulation lab.

### Included simulation scenarios

- `BAD_DEPLOYMENT`
- `DATABASE_CONNECTION_EXHAUSTION`
- `MEMORY_LEAK`
- `DEPENDENCY_FAILURE`
- `TRAFFIC_SPIKE`

## Investigation workflow

```text
Incident context + telemetry
            |
            v
     Evidence extraction
            |
            v
       RCA provider
       /          \
  Bedrock       Baseline rules
       \          /
        v        v
   Structured RCA result
            |
            v
 Schema + evidence validation
            |
            v
 Root cause, confidence, evidence
            |
            v
 Remediation recommendation
            |
            v
       Human review
```

When `IAMFIXER_AI_PROVIDER=auto`, the backend can fall back to deterministic RCA if the Bedrock call fails or its output cannot be used. Actual live Bedrock execution requires valid AWS credentials, permissions, a supported model ID, and regional model access.

## Architecture

```text
React + TypeScript + Vite
            |
        REST API
            |
            v
      FastAPI backend
       /           \
      v             v
 SQLAlchemy       RCA provider factory
      |             /           \
   SQLite      Amazon Bedrock   Baseline RCA
```

The frontend communicates with the FastAPI API. The backend manages incident and telemetry workflows, persistence, simulation, and RCA provider selection. In the documented Vercel deployment, the frontend and API are served from one origin.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Motion, Lucide React |
| Backend | Python, FastAPI, Pydantic, Uvicorn |
| Persistence | SQLAlchemy 2.x, SQLite |
| AI | Amazon Bedrock Converse API, boto3 |
| Testing | pytest |
| Deployment | Vercel |

## Run locally

### Prerequisites

- Python 3.11 or newer
- Node.js 18 or newer and npm
- Git
- AWS credentials and Bedrock model access only if you want to test live Bedrock inference

### 1. Clone the repository

```bash
git clone https://github.com/AkashS-0107/IAMFixer.git
cd IAMFixer
```

### 2. Set up the backend

```bash
cd backend
python -m venv .venv
```

Activate the environment:

**Windows PowerShell**

```powershell
.venv\Scripts\Activate.ps1
```

**macOS / Linux**

```bash
source .venv/bin/activate
```

Install dependencies and create your local environment file from the example:

```bash
pip install -r requirements.txt
```

Copy `backend/.env.example` to `backend/.env` and set the values you need. See [Configuration](#configuration) below. For a baseline-only run, set `IAMFIXER_AI_PROVIDER=baseline` so live Bedrock credentials are not needed for RCA.

Start the API from the `backend` directory:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Useful local endpoints:

- API: <http://127.0.0.1:8000>
- OpenAPI docs: <http://127.0.0.1:8000/docs>
- Health check: <http://127.0.0.1:8000/health>

### 3. Set up the frontend

Open a second terminal at the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. If your local API URL differs, configure `VITE_API_BASE_URL` as described below.

## Configuration

The backend reads its configuration from environment variables. The frontend's `VITE_` variables are bundled into client-side code, so **never put secrets in them**.

| Variable | Purpose |
|---|---|
| `IAMFIXER_AI_PROVIDER` | RCA provider: `auto`, `bedrock`, or `baseline`. |
| `DATABASE_URL` | SQLAlchemy database URL. Local default: `sqlite:///./iamfixer.db`. |
| `AWS_REGION` | AWS Region used by the Bedrock client. Example: `us-east-1`. |
| `BEDROCK_MODEL_ID` | Model ID available to your AWS account in the selected Region. |
| `AWS_ACCESS_KEY_ID` | Optional backend-only AWS access key; prefer an AWS-supported role or credential provider where available. |
| `AWS_SECRET_ACCESS_KEY` | Optional backend-only AWS secret key. Never commit it. |
| `AWS_SESSION_TOKEN` | Optional backend-only session token for temporary credentials. |
| `VITE_API_BASE_URL` | Frontend API base URL for local development; commonly `http://127.0.0.1:8000`. |

Use the repository's `backend/.env.example` as the source of truth for the available configuration fields. Do not copy real credentials into documentation, screenshots, issues, or commits.

## Tests and build

### Backend tests

Run from the repository root:

```bash
python -m pytest backend/ -v
```

The test suite is designed to exercise backend behavior without requiring paid Bedrock calls for normal tests. Live-provider tests, if enabled, may require AWS credentials and can incur usage charges.

### Frontend production build

```bash
cd frontend
npm install
npm run build
```

### Dependency check

With the backend virtual environment activated:

```bash
python -m pip check
```

Test counts and build results can change as the project evolves; run the commands above to verify the current checkout rather than relying on a static number in this README.

## Deployment notes

The project includes a Vercel-oriented, single-origin deployment setup. The frontend is served as a Vite-built SPA and the backend is exposed through the repository's Vercel Python entry point and API routing configuration. Check the deployment configuration in the repository before adapting it to another host.

**SQLite on serverless infrastructure:** A local SQLite file may not provide durable persistence across serverless instances or cold starts. For a production deployment requiring durable shared data, configure `DATABASE_URL` to use an appropriately managed database and validate migrations, connection handling, and access controls for that environment.

Live Bedrock inference also requires the deployment's backend runtime to have appropriate AWS credentials, IAM permissions, regional model access, and a configured `BEDROCK_MODEL_ID`.

## Security

IAMFixer is designed to keep incident analysis inspectable and remediation under human control. When deploying or contributing:

- Keep `.env` files, access keys, session tokens, and other secrets out of Git.
- Store AWS credentials only in backend environment configuration or a suitable AWS identity mechanism. Never expose them through `VITE_` variables.
- Apply least-privilege IAM permissions for the Bedrock operations the application needs.
- Treat logs, telemetry, and incident payloads as potentially sensitive operational data.
- Validate AI output and evidence references before using them in an investigation result.
- Review remediation suggestions before taking action; IAMFixer does not automatically execute them.
- Before committing, inspect `git status` and the staged diff for secrets or local database files.

## Project structure

```text
IAMFixer/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   └── services/rca/
│   ├── tests/
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
├── api/
│   └── index.py
├── .gitignore
└── README.md
```

## Demo walkthrough

For a concise demo, use this sequence:

1. Open the landing page and navigate to the operations dashboard.
2. Select an incident and inspect its telemetry.
3. Open an evidence reference and follow it to the corresponding event.
4. Run an investigation and review the root-cause result, confidence, and supporting evidence.
5. Inspect the remediation recommendation without executing it automatically.
6. Use the Simulation Lab to demonstrate a reproducible failure scenario.

## Project principle

> **AI should help engineers investigate incidents, not silently take control of production systems.**

IAMFixer combines AI-assisted reasoning, deterministic fallback analysis, structured validation, evidence traceability, controlled simulations, and explicit human oversight to make incident investigation easier to inspect and explain.

## License

This repository includes an MIT License. See the [`LICENSE`](LICENSE) file for the full terms.

---

Built with Python, FastAPI, React, TypeScript, SQLite, and Amazon Bedrock.
