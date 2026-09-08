import os
import json
import httpx
from typing import Optional, Type, TypeVar
from pydantic import BaseModel, ValidationError
from .provider import AIProvider, T
import logging

logger = logging.getLogger(__name__)

class OllamaProvider(AIProvider):
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model = os.getenv("OLLAMA_MODEL", "qwen2.5")
        self.timeout = int(os.getenv("AI_TIMEOUT", "120"))
        
    async def generate(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.1) -> str:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature
                }
            }
            if system_prompt:
                payload["system"] = system_prompt
                
            try:
                response = await client.post(f"{self.base_url}/api/generate", json=payload)
                response.raise_for_status()
                return response.json().get("response", "")
            except httpx.RequestError as e:
                logger.warning(f"Ollama connection error: {e}. Falling back to internal AI engine.")
                from .fallback_generator import generate_fallback_chat_reply
                return generate_fallback_chat_reply(prompt, system_prompt)
            except Exception as e:
                logger.warning(f"Ollama error: {e}. Falling back to internal AI engine.")
                from .fallback_generator import generate_fallback_chat_reply
                return generate_fallback_chat_reply(prompt, system_prompt)
                
    async def generate_structured(self, prompt: str, schema: Type[T], system_prompt: Optional[str] = None, temperature: float = 0.1) -> T:
        schema_json = schema.model_json_schema()
        
        instruction = f"Output valid JSON strictly matching the following schema:\n{json.dumps(schema_json, indent=2)}\nDo not include markdown blocks or any other text."
        full_system_prompt = f"{system_prompt}\n{instruction}" if system_prompt else instruction
        
        max_retries = 2
        for attempt in range(max_retries):
            try:
                raw_response = await self.generate(prompt, full_system_prompt, temperature)
            except Exception as e:
                logger.warning(f"Ollama structured error: {e}. Falling back to smart structured engine.")
                try:
                    from .structured_fallback import generate_fallback_structured
                    return generate_fallback_structured(prompt, schema)
                except Exception as fallback_e:
                    logger.error(f"Fallback structured error: {fallback_e}")
                    raise e
                
            try:
                clean_json = raw_response.strip()
                if clean_json.startswith("```json"):
                    clean_json = clean_json[7:]
                if clean_json.startswith("```"):
                    clean_json = clean_json[3:]
                if clean_json.endswith("```"):
                    clean_json = clean_json[:-3]
                    
                data = json.loads(clean_json.strip())
                return schema.model_validate(data)
            except (json.JSONDecodeError, ValidationError) as e:
                logger.warning(f"Failed to parse LLM structured output: {e}")
                if attempt == max_retries - 1:
                    logger.warning("Falling back to smart structured fallback generator.")
                    from .structured_fallback import generate_fallback_structured
                    return generate_fallback_structured(prompt, schema)
                    
    async def embed(self, text: str) -> list[float]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            payload = {
                "model": self.model,
                "prompt": text
            }
            try:
                response = await client.post(f"{self.base_url}/api/embeddings", json=payload)
                response.raise_for_status()
                return response.json().get("embedding", [])
            except httpx.RequestError as e:
                logger.error(f"Ollama embedding error: {e}")
                raise Exception("AI embedding unavailable")
