"""Routing"""

import csv
import osmnx as ox
import networkx as nx
from geopy.distance import great_circle
from astar import custom_astar_algorithm

def load_ukraine_graph(path: str) -> nx.MultiDiGraph:
    """
    Loads the Ukraine road network from a GraphML file.
    
    :param path: str, A path to the GraphML file.
    :return: nx.MultiDiGraph, The Ukraine road network graph.
    """
    return ox.load_graphml(path)

def heuristic(u: int, v: int, g: nx.Graph) -> float:
    """
    A* heuristic function.

    :param u: int, A node id of the current point.
    :param v: int, A node id of the finish point.
    :param g: nx.Graph, A graph representing the part of the map.
    :return: float, A distance between the u and v.
    """
    lat1, lon1 = g.nodes[u]['y'], g.nodes[u]['x']
    lat2, lon2 = g.nodes[v]['y'], g.nodes[v]['x']

    return great_circle((lat1, lon1), (lat2, lon2)).meters

def get_route(start: tuple, end: tuple, full_graph: nx.MultiDiGraph) -> list:
    """
    Finds bounding box, the nearest nodes, then computes the route using A*.

    :param start: tuple, A start coordinates.
    :param end: tuple, An end coordinates.
    :param full_graph: nx.MultiDiGraph, The Ukraine road network graph.
    :return: list, A route to follow.
    """
    obstacles = set()

    with open('obstacles.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)

        for row in reader:
            if row:
                obstacles.add(int(row[0]))

    distance_km = great_circle(start, end).km
    margin_km = max(1, distance_km * 0.2)
    margin_deg = margin_km / 111.0

    north = max(start[0], end[0]) + margin_deg
    south = min(start[0], end[0]) - margin_deg
    east = max(start[1], end[1]) + margin_deg
    west = min(start[1], end[1]) - margin_deg

    nodes_to_keep = [
        node for node, data in full_graph.nodes(data=True)
        if south <= data['y'] <= north and west <= data['x'] <= east and node not in obstacles
    ]
    subgraph = full_graph.subgraph(nodes_to_keep).copy()

    if not subgraph.nodes:
        raise ValueError('No data in the specified area.')

    start_node = ox.distance.nearest_nodes(subgraph, start[1], start[0])
    end_node = ox.distance.nearest_nodes(subgraph, end[1], end[0])

    route, _ = custom_astar_algorithm(
        subgraph,
        start_node,
        end_node,
        heuristic,
        weight='length'
    )

    return [(subgraph.nodes[node]['y'], subgraph.nodes[node]['x']) for node in route]
