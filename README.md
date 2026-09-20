# IAMFixer — Intelligent Application Monitoring & Fixer

> **Find the failure. Understand the cause. Fix it.**

IAMFixer is an AI-powered incident response and root-cause analysis platform designed for SREs and software engineers. When microservice incidents occur, IAMFixer ingests telemetry streams (logs, metrics, alerts, deployment events, database signals), extracts structured evidence, correlates anomalies, and uses a hybrid AI engine (AWS Bedrock LLM + Deterministic Signal Correlation) to identify the probable root cause, calculate explainable confidence, and provide actionable remediation guidance.

---

## Table of Contents
1. [The Problem](#the-problem)
2. [The Solution](#the-solution)
3. [Key Features](#key-features)
4. [Complete Incident Investigation Workflow](#complete-incident-investigation-workflow)
5. [System Architecture](#system-architecture)
6. [AI & Investigation Architecture](#ai--investigation-architecture)
   - [Amazon Bedrock Integration](#amazon-bedrock-integration)
   - [Baseline Deterministic RCA Fallback](#baseline-deterministic-rca-fallback)
   - [Evidence Grounding & Hallucination Prevention](#evidence-grounding--hallucination-prevention)
7. [Database Architecture & Persistence](#database-architecture--persistence)
8. [Failure Simulation Lab](#failure-simulation-lab)
9. [Technology Stack](#technology-stack)
10. [Setup & Installation](#setup--installation)
11. [Environment Variables](#environment-variables)
12. [Running the Application](#running-the-application)
13. [Testing & Verification](#testing--verification)
14. [Deterministic Reviewer Demo Workflow](#deterministic-reviewer-demo-workflow)
15. [Remediation Safety & Non-Execution Policy](#remediation-safety--non-execution-policy)
16. [Project Limitations & Roadmap](#project-limitations--roadmap)

---

## The Problem

When production applications break, **detecting** the failure takes seconds, but **determining why it happened** often takes hours. Developers and SRE teams are forced to manually open separate dashboards, jump across scattered log providers, correlate metrics against deployment timestamps, and guess which upstream service triggered the cascade.

---

## The Solution

IAMFixer automates and unifies the incident triage workflow into a single, evidence-grounded pipeline:
1. **Aggregates Telemetry**: Collects application logs, host metrics, alerts, and deployment events.
2. **Extracts Signals**: Automatically extracts structured evidence items linked directly to specific telemetry event IDs.
3. **Correlates Anomalies**: Performs temporal correlation across microservice boundaries.
4. **Executes RCA**: Uses AWS Bedrock LLM reasoning (or deterministic correlation fallback) to pinpoint the root cause.
5. **Provides Remediation**: Formulates clear remediation steps with explicit risk classification and human approval requirements.

---

## Key Features

- **Hybrid AI Engine**: Leverages Amazon Bedrock LLM with automatic graceful fallback to deterministic baseline RCA.
- **Strict Evidence Traceability**: Every supporting evidence card links directly to a verifiable telemetry event in the timeline.
- **Ground-Truth Isolation**: RCA engine operates solely on telemetry signals without accessing hidden ground-truth simulation labels.
- **Interactive Telemetry Timeline**: Filterable, searchable chronological telemetry viewer with expandable JSON metadata.
- **Failure Simulation Lab**: 5 pre-built, realistic microservice failure scenarios for instant evaluation.
- **SQLAlchemy 2.x Persistence**: Full database persistence for incidents, telemetry streams, evidence, and investigation results.
- **Safety First Design**: Read-only remediation guidance requiring manual SRE approval before action.

---

## Complete Incident Investigation Workflow

```text
SIMULATED / REPORTED INCIDENT
             ↓
    INCIDENT PERSISTENCE (SQLite / SQLAlchemy 2.x)
             ↓
    TELEMETRY COLLECTION (Logs, Metrics, Alerts, Deployments)
             ↓
    EVIDENCE EXTRACTION (Structured Anomaly Signals)
             ↓
    AI / BASELINE INVESTIGATION PIPELINE
             ↓
    PROBABLE ROOT CAUSE & EXPLAINABLE REASONING
             ↓
    CONFIDENCE SCORE & EVIDENCE TRACEABILITY
             ↓
    REMEDIATION RECOMMENDATION & RISK CLASSIFICATION
             ↓
    HUMAN SRE APPROVAL (Informational Only — No Destructive Execution)
```

---

## System Architecture

```text
+-----------------------------------------------------------------------+
|                           React Frontend                              |
|          (TypeScript, Vite, Tailwind CSS, Lucide Icons)               |
+-----------------------------------------------------------------------+
                                   │ HTTP REST
                                   ▼
+-----------------------------------------------------------------------+
|                         FastAPI Backend                               |
|        (API Routes, Pydantic Schemas, CORS, Error Handlers)           |
+-----------------------------------------------------------------------+
         │                         │                        │
         ▼                         ▼                        ▼
+-----------------+      +-------------------+    +---------------------+
| IncidentService |      | TelemetryService  |    | InvestigationEngine |
+-----------------+      +-------------------+    +---------------------+
                                                            │
                                                            ▼
                                                  +-------------------+
                                                  | EvidenceExtraction|
                                                  +-------------------+
                                                            │
                                                            ▼
                                                  +-------------------+
                                                  | RCAProviderFactory|
                                                  +-------------------+
                                                    /               \
                                                   ▼                 ▼
                                           +--------------+   +---------------+
                                           | Bedrock RCA  |   | Baseline RCA  |
                                           | Provider     |   | Provider      |
                                           +--------------+   +---------------+
                                                   │                 │
                                                   └────────┬────────┘
                                                            ▼
+-----------------------------------------------------------------------+
|                         SQLAlchemy Repositories                       |
|         (IncidentRepo, TelemetryRepo, InvestigationRepo)              |
+-----------------------------------------------------------------------+
                                   │
                                   ▼
+-----------------------------------------------------------------------+
|                      SQLite Persistence Database                      |
|                            (iamfixer.db)                              |
+-----------------------------------------------------------------------+
```

---

## AI & Investigation Architecture

IAMFixer supports three dynamic AI provider modes via `IAMFIXER_AI_PROVIDER`:

1. **`auto` (Recommended)**: Tries Amazon Bedrock first. If Bedrock is unavailable or fails, gracefully falls back to deterministic Baseline RCA and sets `provider_used = "bedrock_fallback_baseline"`.
2. **`bedrock`**: Uses Amazon Bedrock exclusively via `boto3` Converse API (`provider_used = "bedrock"`).
3. **`baseline`**: Uses deterministic signal correlation exclusively (`provider_used = "baseline"`).

### Amazon Bedrock Integration
- **API**: Uses the AWS Bedrock Converse API (`invoke_converse`).
- **Prompt Isolation**: System prompts enforce strict JSON output formatting, bounded context limits, and anti-hallucination rules.
- **Model Support**: Fully compatible with Anthropic Claude 3 / 3.5 Sonnet and Nova models on AWS Bedrock.

### Baseline Deterministic RCA Fallback
- Correlates multi-dimensional signals (e.g. deployment timestamps vs error rate spikes, pool saturation vs timeouts, heap growth vs GC pauses) to compute explainable confidence scores ranging from `0.0` to `1.0`.

### Evidence Grounding & Hallucination Prevention
- AI-generated evidence references are validated against actual telemetry event IDs belonging to the specific incident.
- Any hallucinated or cross-incident evidence IDs are automatically filtered out.

---

## Database Architecture & Persistence

IAMFixer uses **SQLAlchemy 2.x ORM** with **SQLite** (`iamfixer.db`) for full database persistence across application restarts:
- **`incidents`**: Stores incident metadata, severity, status, affected service, detected time, and resolution time.
- **`telemetry_events`**: Stores chronological logs, metrics, alerts, source, and JSON metadata.
- **`evidence`**: Stores extracted evidence signals linked to incidents and telemetry events.
- **`investigations`**: Stores investigation results, provider used, root cause, confidence score, reasoning, recommendation, risk, and approval requirements.

---

## Failure Simulation Lab

IAMFixer includes 5 realistic microservice failure simulation scenarios:

| Scenario ID | Title | Affected Service | Simulated Failure & Telemetry Signal |
| :--- | :--- | :--- | :--- |
| `BAD_DEPLOYMENT` | Bad Application Deployment | `payment-service` | Faulty release v1.8.3 deployment, NullPointerException surge, error rate > 14.7%. |
| `DATABASE_CONNECTION_EXHAUSTION` | DB Connection Exhaustion | `order-service` | Connection leak on order-db, 98% pool utilization, HTTP 503 timeouts. |
| `MEMORY_LEAK` | JVM Heap Memory Leak | `analytics-processor` | Unbounded cache growth, 94.5% heap saturation, 4820ms STW GC pauses. |
| `DEPENDENCY_FAILURE` | External Auth Outage | `checkout-service` | External auth service 504 timeouts, retry storm, 42.1% checkout failure. |
| `TRAFFIC_SPIKE` | Unanticipated Traffic Surge | `user-feed-service` | 5.1x traffic jump (1200->6200 rps), 96.8% host CPU saturation, queue backlog. |

> **Ground-Truth Isolation**: The simulation engine generates telemetry events into the database. The RCA engine inspects only the generated telemetry events without reading simulation labels.

---

## Technology Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy 2.x, Pydantic v2, Uvicorn, Boto3 (AWS Bedrock), Pytest.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons.
- **Database**: SQLite with SQLAlchemy 2.x ORM repositories.

---

## Setup & Installation

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm
- AWS credentials (optional, only required if running live Bedrock inference)

### 1. Clone Repository
```bash
git clone https://github.com/AkashS-0107/IAMFixer.git
cd IAMFixer
```

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Create environment configuration file
cp .env.example .env
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cd ..
```

---

## Environment Variables

Configured via `.env` or system environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `IAMFIXER_AI_PROVIDER` | `auto` | RCA provider mode: `auto`, `bedrock`, or `baseline`. |
| `DATABASE_URL` | `sqlite:///./iamfixer.db` | SQLAlchemy database connection URI. |
| `AWS_REGION` | `us-east-1` | AWS Region for Bedrock client. |
| `BEDROCK_MODEL_ID` | *(Empty)* | Amazon Bedrock model ID (e.g. `us.anthropic.claude-3-5-sonnet-20241022-v2:0`). |
| `HOST` | `127.0.0.1` | FastAPI backend bind host. |
| `PORT` | `8000` | FastAPI backend port. |

---

## Running the Application

### Start FastAPI Backend
```bash
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Base: `http://127.0.0.1:8000`
- OpenAPI Docs: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/health`

### Start React Frontend
In a separate terminal:
```bash
cd frontend
npm run dev
```
- Web Application UI: `http://localhost:5173`

---

## Testing & Verification

### Run Backend Pytest Suite
```bash
python -m pytest backend/ -v
```
*All 44 automated backend tests execute against an isolated in-memory SQLite database (`sqlite:///:memory:`).*

### Run Dependency Check
```bash
python -m pip check
```

### Build Frontend Bundle
```bash
cd frontend
npm run build
```

---

## Deterministic Reviewer Demo Workflow

Follow these steps to evaluate IAMFixer end-to-end:

1. **Launch Services**: Start the backend and frontend dev servers.
2. **Open SRE Console**: Navigate to `http://localhost:5173/`.
3. **Open Simulation Lab**: Click **Simulation Lab** in the navigation header.
4. **Trigger Scenario**: Click **Simulate Incident** under **Bad Application Deployment (`BAD_DEPLOYMENT`)**.
5. **Inspect Incident**: Click **Inspect Incident & Run RCA** on the green notification card to open `/incidents/<incident_id>`.
6. **Review Telemetry**: Switch to the **Telemetry Stream** tab to inspect the chronological sequence of logs, metrics, and alerts.
7. **Run RCA Investigation**: Click **Investigate Incident**. Watch the execution progress feedback.
8. **Analyze Root Cause**: Review the Root Cause card, confidence percentage, reasoning explanation, and provider badge (`AWS Bedrock` or `Baseline RCA`).
9. **Trace Evidence to Telemetry**: Click any supporting evidence card. Notice the application automatically switches to the Telemetry tab and smooth-scrolls with a cyan pulse animation directly to the target telemetry event.
10. **Review Remediation Guidance**: Note the action plan, risk rating (`HIGH`), and explicit **Approval Required** safety tag.
11. **Verify Persistence**: Refresh the browser or restart the backend server. Re-navigate to the incident page—all incident details, telemetry events, and investigation results remain persisted in `iamfixer.db`.

---

## Remediation Safety & Non-Execution Policy

IAMFixer operates strictly as an **informational advisor**:
- **No Destructive APIs**: The platform does NOT contain automated endpoints to execute AWS infrastructure modifications or rollback commands.
- **Approval Enforcement**: Recommendations classified as `HIGH` or `MEDIUM` risk explicitly display **Manual SRE Approval Required**.
- **Human-in-the-Loop**: All corrective actions must be reviewed and executed manually by an authorized engineer.

---

## Project Limitations & Roadmap

### What is Simulated vs. Real
- **Simulated**: Failure scenarios in the Simulation Lab generate synthetic telemetry events to demonstrate incident triage workflows.
- **Real**: The FastAPI backend, SQLAlchemy 2.x persistence layer, Pydantic schemas, evidence extraction algorithms, deterministic baseline RCA engine, and AWS Bedrock Converse API integration are 100% real and production-tested.

### Future Roadmap
- Integration with live AWS CloudWatch Logs & Metrics streams via AWS SDK.
- OpenTelemetry (OTel) receiver endpoints for real-time trace ingestion.
- Slack & PagerDuty webhook notifications for critical incidents.
