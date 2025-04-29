"""Main"""
from dotenv import load_dotenv
import os
import csv
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import osmnx as ox
from routing import get_route, load_ukraine_graph

load_dotenv()
ADMIN_SECRET = os.getenv("ADMIN_SECRET")

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
    allow_origins=['http://localhost:3000', 'https://stable-cacilie-ex0dus-3d0bcc9b.koyeb.app'],
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
        algorithm = data['algorithm']
        route_coords, bounding_box = get_route(start, end, margin, algorithm, app.state.ukraine_graph)
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

@app.get('/get-obstacles')
async def get_unconfirmed_obstacles(request: Request):
    """
    Endpoint for retrieving unconfirmed obstacles.

    :return: dict — {'unconfirmed_obstacles': [{"id": node_id, "lat": lat, "lon": lon}, ...]}
    """
    try:
        secret = request.headers.get("ADMIN_SECRET")
        if secret != ADMIN_SECRET:
            raise HTTPException(status_code=403, detail="Forbidden")

        graph = app.state.ukraine_graph
        confirmed, unconfirmed = [], []

        if os.path.exists('obstacles_confirmed.csv'):
            with open('obstacles_confirmed.csv', encoding='utf-8') as f:
                for row in csv.reader(f):
                    if row:
                        node_id = int(row[0])
                        node = graph.nodes[node_id]
                        confirmed.append({"id": node_id, "lat": node['y'], "lon": node['x']})

        if os.path.exists('obstacles_unconfirmed.csv'):
            with open('obstacles_unconfirmed.csv', encoding='utf-8') as f:
                for row in csv.reader(f):
                    if row:
                        node_id = int(row[0])
                        if any(o["id"] == node_id for o in confirmed):
                            continue
                        node = graph.nodes[node_id]
                        unconfirmed.append({"id": node_id, "lat": node['y'], "lon": node['x']})

        return {
            "confirmed": confirmed,
            "unconfirmed": unconfirmed
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.post('/confirm-obstacles')
async def confirm_obstacles(request: Request):
    """
    Admin confirms a set of obstacles.
    Keeps only confirmed ones in confirmed list.
    All others are removed from both confirmed and unconfirmed lists.

    :param request: Request — JSON with 'confirmed_ids': [id1, id2, ...]
    :return: dict — {'status': 'ok', 'confirmed': [id1, id2, ...]}    
    """
    try:
        secret = request.headers.get("ADMIN_SECRET")
        if secret != ADMIN_SECRET:
            raise HTTPException(status_code=403, detail="Forbidden")

        data = await request.json()
        confirmed_ids = set(data.get("confirmed_ids", []))
        all_ids = set(data.get("all_ids", []))

        with open('obstacles_confirmed.csv', 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            for node_id in confirmed_ids:
                writer.writerow([node_id])

        with open('obstacles_unconfirmed.csv', 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            for node_id in (all_ids - confirmed_ids):
                writer.writerow([node_id])


        return {
            "status": "ok",
            "confirmed": list(confirmed_ids),
            "unconfirmed": list(all_ids - confirmed_ids)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.post('/delete-obstacle')
async def delete_obstacle(request: Request):
    """
    Delete a specific obstacle by node_id from both confirmed and unconfirmed lists.

    :param request: Request — JSON with 'node_id': id
    :return: dict — {'status': 'ok', 'deleted': node_id}
    """
    try:
        secret = request.headers.get("ADMIN_SECRET")
        if secret != ADMIN_SECRET:
            raise HTTPException(status_code=403, detail="Forbidden")

        data = await request.json()
        node_id = int(data.get("node_id"))

        # Видаляємо з confirmed
        if os.path.exists('obstacles_confirmed.csv'):
            with open('obstacles_confirmed.csv', encoding='utf-8') as f:
                confirmed = [row for row in csv.reader(f) if row and int(row[0]) != node_id]

            with open('obstacles_confirmed.csv', 'w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                writer.writerows(confirmed)

        if os.path.exists('obstacles_unconfirmed.csv'):
            with open('obstacles_unconfirmed.csv', encoding='utf-8') as f:
                unconfirmed = [row for row in csv.reader(f) if row and int(row[0]) != node_id]

            with open('obstacles_unconfirmed.csv', 'w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                writer.writerows(unconfirmed)

        return {"status": "ok", "deleted": node_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
