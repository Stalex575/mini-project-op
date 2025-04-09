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
        app.state.ukraine_graph = load_ukraine_graph('lviv_drive.graphml')
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
async def obstacles(request: Request) -> dict:
    """
    Obstacles endpoint.

    :param request: Request, A frontend request with obstacles coordinates [[start, end], ...].
    :return: dict, Appends new obstacles and/or sends all obstacles' coords.
    """
    try:
        data = await request.json()
        graph = app.state.ukraine_graph

        if data:
            node_ids = {
                ox.distance.nearest_nodes(graph, lon, lat)
                for lat, lon in data['obstacles']
            }

            with open('obstacles.csv', 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)

                for node_id in node_ids:
                    writer.writerow([node_id])

        obstacles_coords = []

        with open('obstacles.csv', 'r', encoding='utf-8') as f:
            reader = csv.reader(f)

            for row in reader:
                if row:
                    node_id = int(row[0])
                    node_data = graph.nodes[node_id]
                    lat, lon = node_data['y'], node_data['x']
                    obstacles_coords.append([lat, lon])

        return {"obstacles": obstacles_coords}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
