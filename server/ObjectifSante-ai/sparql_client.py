import aiohttp

FUSEKI_URL = "http://localhost:3030/SmartHealth"

async def run_select(query: str):
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{FUSEKI_URL}/query", params={"query": query}, headers={"Accept": "application/sparql-results+json"}) as resp:
            return await resp.json()

async def run_update(query: str):
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{FUSEKI_URL}/update", data=query, headers={"Content-Type": "application/sparql-update"}) as resp:
            return await resp.text()
