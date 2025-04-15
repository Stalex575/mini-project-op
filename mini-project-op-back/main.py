"""Main"""

import os
import csv
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import osmnx as ox
from routing import get_route, load_ukraine_graph

@asynccontextmanager
async def lifespan(application: FastAPI):
    """
    Loads the Ukraine map in the app's state at the beggining.

    :param application: FastAPI, A main application.
    """
    try:
        application.state.ukraine_graph = load_ukraine_graph('lviv_drive.graphml')
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
        margin = data['margin']
        route_coords, bounding_box = get_route(start, end, margin, app.state.ukraine_graph)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    return {"route": route_coords, "bounding_box": bounding_box}

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

            with open('obstacles_unconfirmed.csv', 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)

                for node_id in node_ids:
                    writer.writerow([node_id])

        obstacles_coords = []

        with open('obstacles_unconfirmed.csv', encoding='utf-8') as f:
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

@app.get('/unconfirmed-obstacles')
async def get_unconfirmed_obstacles():
    """
    Endpoint for retrieving unconfirmed obstacles.

    :return: dict — {'unconfirmed_obstacles': [{"id": node_id, "lat": lat, "lon": lon}, ...]}
    """
    try:
        graph = app.state.ukraine_graph
        obstacles = []

        with open('obstacles_unconfirmed.csv', 'r', encoding='utf-8') as file:
            reader = csv.reader(file)
            for row in reader:
                if row:
                    node_id = int(row[0])
                    node_data = graph.nodes[node_id]
                    lat, lon = node_data['y'], node_data['x']
                    obstacles.append({"id": node_id, "lat": lat, "lon": lon})

        confirmed_ids = set()
        if os.path.exists('obstacles_confirmed.csv'):
            with open('obstacles_confirmed.csv', 'r', encoding='utf-8') as file:
                confirmed_ids = {int(row[0]) for row in csv.reader(file) if row}
        else:
            confirmed_ids = set()
        unconfirmed = [o for o in obstacles if o["id"] not in confirmed_ids]
        return {"unconfirmed_obstacles": unconfirmed}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.post('/confirm-obstacles')
async def confirm_obstacles(request: Request):
    """
    Endpoint for confirming obstacles.

    :param request: Request — JSON with 'confirmed_ids': [id1, id2, ...]
    :return: dict — {'status': 'ok', 'confirmed': [id1, id2, ...]}    
    """
    try:
        data = await request.json()
        unconfirmed_ids = data.get("unconfirmed_ids", [])

        with open('obstacles_unconfirmed.csv', 'r', encoding='utf-8') as file:
            reader = csv.reader(file)
            unconfirmed_rows = [row for row in reader if row]
        confirmed_ids = []
        deleted_ids = []

        with open('obstacles_confirmed.csv', 'w', encoding='utf-8'):
            writer = csv.writer(file)
            for row in unconfirmed_rows:
                node_id = int(row[0])
                if node_id in unconfirmed_ids:
                    deleted_ids.append(node_id)
                else:
                    confirmed_ids.append(node_id)
                    writer.writerow([node_id])
        open('obstacles_unconfirmed.csv', 'w', encoding='utf-8').close()

        return {
            "status": "ok",
            "confirmed": confirmed_ids,
            "deleted": deleted_ids
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
