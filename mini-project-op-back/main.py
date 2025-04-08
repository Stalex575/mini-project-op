"""Main"""

import csv
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import osmnx as ox
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

@app.post('/obstacles')
async def obstacles(request: Request) -> None:
    """
    Obstacles endpoint.

    :param request: Request, A frontend request with obstacles coordinates [[start, end], ...].
    """
    try:
        data = await request.json()
        graph = app.state.ukraine_graph

        node_ids = [
            ox.distance.nearest_nodes(graph, lon, lat)
            for lat, lon in data['obstacles']
        ]

        with open('obstacles.csv', 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)

            for node_id in node_ids:
                writer.writerow([node_id])

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
