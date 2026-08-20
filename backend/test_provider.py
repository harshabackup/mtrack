import asyncio
import sys
import logging
from app.ai.ollama_provider import OllamaProvider
from pydantic import BaseModel
logging.basicConfig(level=logging.DEBUG)

class TestSchema(BaseModel):
    name: str

async def test():
    provider = OllamaProvider()
    try:
        res = await provider.generate_structured(
            prompt="My name is Bob",
            schema=TestSchema,
            system_prompt="Extract name",
            temperature=0.1
        )
        print("SUCCESS:", res)
    except Exception as e:
        print("EXCEPTION TYPE:", type(e))
        print("EXCEPTION MSG:", str(e))

asyncio.run(test())
