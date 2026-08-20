import httpx, asyncio, sys
async def test():
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post('http://host.docker.internal:11434/api/tags')
            print('SUCCESS', resp.status_code)
    except Exception as e:
        print('ERROR TYPE:', type(e))
        print('ERROR MSG:', str(e))
asyncio.run(test())
