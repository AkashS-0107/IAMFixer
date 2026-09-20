# IAMFixer

**AI-powered incident investigation and root-cause analysis for modern applications.**

IAMFixer is an incident investigation platform that combines application telemetry, evidence traceability, deterministic analysis, and **AWS Bedrock-powered RCA** to help engineers understand production incidents and generate evidence-backed remediation recommendations.

> **Recommendation only. Human approval required.**
> IAMFixer does not automatically modify infrastructure or execute remediation actions.

---

## What IAMFixer Does

IAMFixer follows an incident from detection to investigation:

```text
Incident
   ↓
Telemetry Collection
   ↓
Evidence Extraction
   ↓
AI / Deterministic RCA
   ↓
Root Cause + Confidence
   ↓
Evidence Traceability
   ↓
Remediation Recommendation
   ↓
Human Approval
The platform is designed around the idea that an AI-generated diagnosis should be traceable to actual incident evidence, rather than being an unexplained LLM response.
Core Features
AI-Powered Root Cause Analysis
Uses Amazon Bedrock to analyze:
- Incident context
- Application telemetry
- Extracted evidence
- Service information
- Failure patterns
The Bedrock response is validated against a structured RCA schema before being presented to the user.
Multi-Provider RCA
IAMFixer supports three provider modes:
Mode	Behavior
bedrock	Uses AWS Bedrock directly
baseline	Uses deterministic rule-based RCA
auto	Uses Bedrock with automatic baseline fallback


If Bedrock becomes unavailable because of authentication, throttling, network failure, missing configuration, or malformed output, the system can fall back to the deterministic RCA provider.
AWS Bedrock
     │
     ├── Success → Bedrock RCA
     │
     └── Failure → Baseline RCA
The UI identifies this state as:
AWS Bedrock → Baseline Fallback
Evidence Traceability
RCA results contain references to the telemetry evidence supporting the diagnosis.
Selecting an evidence item in the investigation view:
Evidence
   ↓
Telemetry Tab
   ↓
Target Event
   ↓
Automatic Scroll
   ↓
Visual Highlight
This allows engineers to inspect the underlying event instead of blindly trusting the generated explanation.
Simulation Lab
IAMFixer includes controlled incident scenarios for reproducible testing and demonstrations.
Current scenarios include:
- BAD_DEPLOYMENT
- DATABASE_CONNECTION_EXHAUSTION
- MEMORY_LEAK
- DEPENDENCY_FAILURE
- TRAFFIC_SPIKE
The Simulation Lab allows the investigation pipeline to be demonstrated without requiring an actual production outage.
Safety Governance
IAMFixer is deliberately recommendation-only.
The system does not automatically:
- Modify AWS infrastructure
- Restart services
- Change deployments
- Alter production configuration
- Execute remediation commands
Investigation results can contain remediation recommendations, but high- and medium-risk recommendations require human approval.
AI Diagnosis
     ↓
Recommendation
     ↓
Human Review
     ↓
Human Decision
Architecture
┌─────────────────────────────────────────────┐
│                  Frontend                   │
│        React + TypeScript + Vite            │
│                                             │
│  Landing │ Dashboard │ Investigation │ Lab  │
└──────────────────────┬──────────────────────┘
                       │
                       │ REST API
                       ▼
┌─────────────────────────────────────────────┐
│                   Backend                   │
│              FastAPI + Python               │
│                                             │
│  Incidents │ Telemetry │ Investigation      │
│  RCA Factory │ Health │ Simulation          │
└──────────────┬──────────────────┬───────────┘
               │                  │
               ▼                  ▼
        ┌─────────────┐    ┌───────────────┐
        │   SQLite    │    │  RCA Engine   │
        │ SQLAlchemy  │    │               │
        └─────────────┘    │ AWS Bedrock   │
                           │      ↓        │
                           │ Baseline RCA  │
                           └───────────────┘
Technology Stack
Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Motion
- Lucide React
Backend
- Python
- FastAPI
- Pydantic
- Uvicorn
- SQLAlchemy
- SQLite
- Pytest
AI / Cloud
- Amazon Bedrock
- AWS SDK for Python (boto3)
Engineering
- REST APIs
- Structured RCA schemas
- Automated testing
- Evidence traceability
- Human-in-the-loop safety controls
Project Structure
IAMFixer/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   └── services/
│   │       └── rca/
│   │           ├── baseline.py
│   │           ├── bedrock_client.py
│   │           ├── bedrock_provider.py
│   │           └── factory.py
│   │
│   ├── tests/
│   ├── .env.example
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md
Getting Started
Prerequisites
Install:
- Python 3.11+
- Node.js 18+
- npm
- AWS account with appropriate Amazon Bedrock access for live AI testing
Backend Setup
cd backend
Create a virtual environment:
python -m venv .venv
Activate it on Windows:
.venv\Scripts\activate
Install dependencies:
pip install -r requirements.txt
Create:
backend/.env
Example:
IAMFIXER_AI_PROVIDER=auto

AWS_REGION=us-east-1
BEDROCK_MODEL_ID=your-bedrock-model-id

AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
# AWS_SESSION_TOKEN=your-session-token
Never commit .env or AWS credentials to GitHub.
Start the backend:
uvicorn app.main:app --reload
Backend:
http://127.0.0.1:8000
Health endpoint:
http://127.0.0.1:8000/health
Frontend Setup
Open another terminal:
cd frontend
Install dependencies:
npm install
Start the development server:
npm run dev
Frontend:
http://localhost:5173
Testing
Backend
From the backend directory:
python -m pytest -v
Current verification:
45 passed
2 skipped
The skipped tests are controlled live AWS Bedrock tests and are intentionally gated to prevent accidental AWS usage during normal offline testing.
Frontend
npm run build
The production build has been verified with:
0 TypeScript errors
0 Vite bundler errors
AWS Bedrock
IAMFixer uses the Bedrock Converse API through boto3.
The AI investigation flow is:
Incident Context
       +
Telemetry
       +
Evidence
       ↓
Prompt Builder
       ↓
Amazon Bedrock
       ↓
Structured Response
       ↓
Pydantic Validation
       ↓
Evidence Validation
       ↓
RCA Result
The application validates:
- RCA response structure
- Confidence boundaries
- Evidence references
- Provider metadata
- Recommendation safety requirements
If Bedrock cannot produce a valid result in auto mode, IAMFixer falls back to deterministic RCA.
Security
IAMFixer follows several security principles:
- No credentials hardcoded in source code
- .env excluded from Git
- AWS credential files excluded from Git
- Secrets are not returned through API responses
- Credentials are not written to application logs
- Bedrock output is schema validated
- Untrusted incident data is treated as data rather than instructions
- No automatic infrastructure mutation
Before pushing the project to GitHub, verify:
git status
and ensure no .env files or credential material are staged.
UI & UX
The frontend uses a dark technical operations-console visual system with:
- Responsive layouts
- Motion-based transitions
- Scroll-reveal animations
- Reduced-motion support
- Keyboard accessibility
- Evidence highlighting
- Animated RCA confidence visualization
- Operational health indicators
- Severity-aware status presentation
- Mobile, tablet, and desktop support
The interface is organized around four primary areas:
/
├── Landing Page
│
├── /dashboard
│   └── Operations Console
│
├── /incidents/:id
│   └── Incident Investigation
│
└── /simulation
    └── Simulation Lab
Current Validation
IAMFixer has been validated across the major application layers:
Area	Status
Frontend build	Passed
TypeScript compilation	Passed
Backend tests	45 passed
RCA provider tests	Passed
Bedrock schema validation	Passed
Baseline fallback	Passed
Evidence traceability	Passed
SQLite persistence	Passed
Simulation scenarios	Passed
Health endpoint	Passed
Secret protection	Verified
Safety governance	Verified
Responsive UI	Verified
Reduced-motion support	Verified


Demo Workflow
The recommended demonstration flow is:
Landing Page
     ↓
Operations Console
     ↓
Select Incident
     ↓
Telemetry
     ↓
Evidence
     ↓
AWS Bedrock RCA
     ↓
Root Cause + Confidence
     ↓
Evidence Traceability
     ↓
Recommendation
     ↓
Human Approval
     ↓
Simulation Lab
Project Goal
IAMFixer is designed around a simple principle:
AI should help engineers investigate incidents, not silently take control of production systems.

The project combines AI-assisted reasoning with deterministic fallbacks, evidence traceability, structured validation, persistent investigation data, controlled simulations, and explicit human oversight.
License
Add the project's intended license here before publishing if required by the hackathon or repository policy.
Built with React, FastAPI, Python, SQLite, and Amazon Bedrock.
