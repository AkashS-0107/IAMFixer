# IAMFixer Backend

Backend service for **IAMFixer** (Intelligent Application Monitoring & Fixer), built with Python, FastAPI, SQLAlchemy 2.x, SQLite, Pydantic, Uvicorn, and pytest.

---

## Architecture Overview

```text
Incident Request / Simulation Scenario
                 ↓
      API Routes (FastAPI)
                 ↓
             Services
    ├── IncidentService
    ├── TelemetryService
    ├── EvidenceExtractionService
    └── InvestigationEngine
                 ↓
           RCA Provider (Abstract Interface)
    ├── BaselineRCAProvider (Deterministic Signal Correlation)
    ├── BedrockRCAProvider (AWS Bedrock AI Integration)
    └── AutoRCAProvider (Automatic Bedrock -> Baseline Fallback)
                 ↓
        Repository Layer (Abstract Interface)
    ├── SQLAlchemyIncidentRepository
    ├── SQLAlchemyTelemetryRepository
    └── SQLAlchemyInvestigationRepository
                 ↓
           Database Layer (SQLAlchemy 2.x)
                 ↓
           SQLite (iamfixer.db)
```

---

## Database Configuration & Persistence

IAMFixer uses **SQLite** and **SQLAlchemy 2.x** for database persistence.

- **`DATABASE_URL`**: Defaults to `sqlite:///./iamfixer.db`.
- **Custom Database Config**: Can be overridden via environment variables in `.env`:
  ```env
  DATABASE_URL=sqlite:///./iamfixer.db
  ```
- **Automatic Initialization**: Application startup automatically creates required database tables (`incidents`, `telemetry_events`, `evidence`, `investigations`) without dropping existing data.
- **Local Development Data Reset**: To reset local development data, simply remove `iamfixer.db` and restart the backend server.
- **Test Database Isolation**: Automated tests execute using an isolated in-memory SQLite database (`sqlite:///:memory:`), ensuring tests never touch or alter the local `iamfixer.db` database.

---

## Getting Started

### Prerequisites
- Python 3.10+
- pip

### 1. Install Dependencies

From the workspace root or `backend` directory:

```bash
pip install -r backend/requirements.txt
```

### 2. Configuration

Copy `.env.example` to `.env` if custom environment settings are needed:

```bash
cp .env.example .env
```

---

## Running the Application

From the `backend` directory, run Uvicorn:

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The service will be accessible at:
- API Base: `http://127.0.0.1:8000`
- Health Endpoint: `http://127.0.0.1:8000/health`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- ReDoc Docs: `http://127.0.0.1:8000/redoc`

---

## Running Automated Tests

Run the complete pytest test suite:

```bash
python -m pytest backend/ -v
```

All tests execute with automated in-memory database fixtures to ensure zero cross-test state pollution and zero disk side-effects.

---

## Simulation Scenarios

IAMFixer includes 5 deterministic failure simulation scenarios:

1. **`BAD_DEPLOYMENT`**: Faulty release deployment introducing application exception surge and latency spikes.
2. **`DATABASE_CONNECTION_EXHAUSTION`**: Connection pool saturation under load leading to connection wait timeouts and 503 errors.
3. **`MEMORY_LEAK`**: Heap memory growth crossing threshold causing GC pauses and OutOfMemoryErrors.
4. **`DEPENDENCY_FAILURE`**: Upstream service timeout and retry exhaustion propagating cascading checkout errors.
5. **`TRAFFIC_SPIKE`**: Sudden 5x request volume surge causing host CPU saturation and request queue backlogs.

Trigger scenarios via:
```bash
POST /api/simulation/{scenario}
```
