"""Main"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
# import get_route()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.post('/route')
async def route(request: Request):
    """Route endpoint"""
    try:
        data = await request.json()
        start = tuple(data['start'])
        end = tuple(data['end'])
        route_coords = (start, end)
        # route_coords = get_route(start, end)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    return {"route": route_coords}
