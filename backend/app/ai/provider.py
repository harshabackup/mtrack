from pydantic import BaseModel
from typing import Optional, Type, TypeVar, Any
from abc import ABC, abstractmethod

T = TypeVar('T', bound=BaseModel)

class AIProvider(ABC):
    """
    Abstract base class for AI Providers.
    Ensures modularity so we can swap out Ollama for OpenAI, Gemini, etc.
    """

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.1
    ) -> str:
        """Generate plain text from a prompt."""
        raise NotImplementedError

    @abstractmethod
    async def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        system_prompt: Optional[str] = None,
        temperature: float = 0.1
    ) -> T:
        """Generate structured data validating against a Pydantic schema."""
        raise NotImplementedError

    @abstractmethod
    async def embed(self, text: str) -> list[float]:
        """Generate vector embeddings for semantic search."""
        raise NotImplementedError
