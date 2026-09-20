from typing import Any, Optional
import boto3
from botocore.exceptions import (
    BotoCoreError,
    ClientError,
    EndpointConnectionError,
    NoCredentialsError,
)
from app.core.exceptions import (
    BedrockAuthenticationError,
    BedrockAuthorizationError,
    BedrockConfigurationError,
    BedrockError,
    BedrockNetworkError,
)
from app.core.logging import logger


class BedrockClient:
    """
    Isolated wrapper around AWS Bedrock Runtime SDK using the modern 'converse' API.
    Prevents boto3 SDK dependencies from leaking into application logic.
    """

    def __init__(self, client: Optional[Any] = None):
        """
        Supports passing an injected boto3 client (useful for unit tests/mocking).
        """
        self._injected_client = client

    def get_client(self, region_name: Optional[str] = None) -> Any:
        """Instantiates or returns the boto3 bedrock-runtime client."""
        if self._injected_client is not None:
            return self._injected_client

        try:
            kwargs = {}
            target_region = region_name or settings.aws_region
            if target_region:
                kwargs["region_name"] = target_region

            if settings.aws_access_key_id and settings.aws_secret_access_key:
                kwargs["aws_access_key_id"] = settings.aws_access_key_id
                kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
                if settings.aws_session_token:
                    kwargs["aws_session_token"] = settings.aws_session_token

            return boto3.client("bedrock-runtime", **kwargs)
        except NoCredentialsError:
            raise BedrockAuthenticationError("AWS credentials were not found in standard provider chain.")
        except Exception as e:
            logger.error(f"Failed to initialize boto3 Bedrock client: {e}")
            raise BedrockConfigurationError(f"Failed to initialize AWS Bedrock client: {str(e)}")

    def invoke_converse(
        self,
        model_id: str,
        system_prompt: str,
        user_prompt: str,
        region_name: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: int = 2048,
    ) -> str:
        """
        Invokes Amazon Bedrock using the modern 'converse' API.

        Returns:
            The textual output response string from the model.
        """
        if not model_id:
            raise BedrockConfigurationError("BEDROCK_MODEL_ID is not configured.")

        client = self.get_client(region_name=region_name)

        messages = [
            {
                "role": "user",
                "content": [{"text": user_prompt}],
            }
        ]

        system = [{"text": system_prompt}]

        inference_config = {
            "temperature": temperature,
            "maxTokens": max_tokens,
        }

        try:
            logger.info(f"Invoking Bedrock model '{model_id}' via converse API...")
            response = client.converse(
                modelId=model_id,
                messages=messages,
                system=system,
                inferenceConfig=inference_config,
            )

            output_message = response.get("output", {}).get("message", {})
            content_blocks = output_message.get("content", [])

            if not content_blocks:
                raise BedrockError("Bedrock converse API returned empty content payload.")

            text_content = content_blocks[0].get("text", "")
            if not text_content:
                raise BedrockError("Bedrock model response contained no text.")

            return text_content

        except NoCredentialsError:
            logger.error("AWS credentials missing during Bedrock model invocation.")
            raise BedrockAuthenticationError("AWS credentials missing or expired.")

        except ClientError as ce:
            error_code = ce.response.get("Error", {}).get("Code", "")
            error_msg = ce.response.get("Error", {}).get("Message", str(ce))
            logger.warning(f"AWS Bedrock ClientError [{error_code}]: {error_msg}")

            if error_code in ["AccessDeniedException", "ResourceNotFoundException", "UnrecognizedClientException"]:
                if "AccessDenied" in error_code or "AccessDenied" in error_msg:
                    raise BedrockAuthorizationError(f"Access denied to model '{model_id}': {error_msg}")
                raise BedrockAuthenticationError(f"AWS Authentication failed: {error_msg}")
            elif error_code in ["ThrottlingException", "ServiceUnavailableException", "InternalServerException"]:
                raise BedrockNetworkError(f"AWS Bedrock service error ({error_code}): {error_msg}")
            else:
                raise BedrockError(f"AWS Bedrock error ({error_code}): {error_msg}")

        except EndpointConnectionError as ece:
            logger.error(f"Failed to connect to AWS Bedrock endpoint: {ece}")
            raise BedrockNetworkError("Failed to reach AWS Bedrock endpoint network.")

        except BotoCoreError as bce:
            logger.error(f"BotoCore error during Bedrock invocation: {bce}")
            raise BedrockError(f"AWS SDK error: {str(bce)}")

        except Exception as e:
            if isinstance(e, BedrockError):
                raise e
            logger.error(f"Unexpected error during Bedrock call: {e}", exc_info=True)
            raise BedrockError(f"Unexpected error during AI invocation: {str(e)}")
