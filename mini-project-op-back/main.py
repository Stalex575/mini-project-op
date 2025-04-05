"""Main"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from routing import get_route, load_ukraine_graph

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Loads the Ukraine map in the app's state at the beggining.

    :param app: FastAPI, A main app.
    """
    try:
        app.state.ukraine_graph = load_ukraine_graph('ukraine_drive.graphml')
    except Exception as e:
        raise ValueError(f'Error loading map: {e}') from e
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.post('/route')
async def route(request: Request) -> dict:
    """
    Route endpoint.

    :param request: Request, A frontend request with coordinates [start, end].
    :return: dict, A route to follow.
    """
    try:
        data = await request.json()
        start = tuple(data['start'])
        end = tuple(data['end'])
        route_coords = get_route(start, end, app.state.ukraine_graph)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    return {"route": route_coords}
