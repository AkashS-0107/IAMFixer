from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from app.core.logging import logger


class DomainException(Exception):
    """Base exception for IAMFixer domain errors."""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class IncidentNotFoundError(DomainException):
    """Raised when an incident is not found."""
    def __init__(self, incident_id: str):
        super().__init__(
            message=f"Incident with ID '{incident_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class InvestigationNotFoundError(DomainException):
    """Raised when an investigation is not found."""
    def __init__(self, incident_id: str):
        super().__init__(
            message=f"Investigation for incident ID '{incident_id}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class SimulationScenarioNotFoundError(DomainException):
    """Raised when an invalid simulation scenario is requested."""
    def __init__(self, scenario: str, available_scenarios: list[str]):
        super().__init__(
            message=f"Unknown simulation scenario '{scenario}'. Available scenarios: {', '.join(available_scenarios)}",
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class InvalidIncidentError(DomainException):
    """Raised when incident data is invalid."""
    def __init__(self, detail: str):
        super().__init__(
            message=detail,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )


class BedrockError(DomainException):
    """Base exception for AWS Bedrock RCA provider failures."""
    def __init__(self, message: str, status_code: int = status.HTTP_502_BAD_GATEWAY):
        super().__init__(message=message, status_code=status_code)


class BedrockConfigurationError(BedrockError):
    """Raised when Bedrock model ID, region, or environment settings are missing or invalid."""
    def __init__(self, message: str):
        super().__init__(message=message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BedrockAuthenticationError(BedrockError):
    """Raised when AWS credentials are missing, expired, or invalid."""
    def __init__(self, message: str = "AWS authentication failed. Please verify credentials."):
        super().__init__(message=message, status_code=status.HTTP_502_BAD_GATEWAY)


class BedrockAuthorizationError(BedrockError):
    """Raised when AWS model access is denied or IAM permissions are missing."""
    def __init__(self, message: str = "AWS Bedrock model access denied."):
        super().__init__(message=message, status_code=status.HTTP_502_BAD_GATEWAY)


class BedrockNetworkError(BedrockError):
    """Raised when network, connection, or service unavailability occurs against AWS Bedrock."""
    def __init__(self, message: str = "AWS Bedrock service connection error."):
        super().__init__(message=message, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)


class BedrockResponseParsingError(BedrockError):
    """Raised when LLM model response is malformed or cannot be parsed as JSON."""
    def __init__(self, message: str = "Failed to parse structured RCA JSON from Bedrock response."):
        super().__init__(message=message, status_code=status.HTTP_502_BAD_GATEWAY)


class BedrockValidationError(BedrockError):
    """Raised when LLM output fields (e.g. confidence score, risk enum) fail schema validation."""
    def __init__(self, message: str):
        super().__init__(message=message, status_code=status.HTTP_502_BAD_GATEWAY)


class BedrockEvidenceIntegrityError(BedrockError):
    """Raised when LLM output contains hallucinated or cross-incident evidence references."""
    def __init__(self, message: str):
        super().__init__(message=message, status_code=status.HTTP_502_BAD_GATEWAY)


def register_exception_handlers(app: FastAPI) -> None:

    """Registers exception handlers for custom domain exceptions."""

    @app.exception_handler(DomainException)
    async def domain_exception_handler(request: Request, exc: DomainException):
        logger.warning(f"Domain exception on {request.method} {request.url.path}: {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message, "error_type": exc.__class__.__name__},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled internal server error on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal server error occurred while processing the request."},
        )
