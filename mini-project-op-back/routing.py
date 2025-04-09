# """Routing"""

# import csv
# import osmnx as ox
# import networkx as nx
# from geopy.distance import great_circle

# def load_ukraine_graph(path: str) -> nx.MultiDiGraph:
#     """
#     Loads the Ukraine road network from a GraphML file.
    
#     :param path: str, A path to the GraphML file.
#     :return: nx.MultiDiGraph, The Ukraine road network graph.
#     """
#     return ox.load_graphml(path)

# def heuristic(u: int, v: int, g: nx.Graph) -> float:
#     """
#     A* heuristic function.

#     :param u: int, A node id of the current point.
#     :param v: int, A node id of the finish point.
#     :param g: nx.Graph, A graph representing the part of the map.
#     :return: float, A distance between the u and v.
#     """
#     lat1, lon1 = g.nodes[u]['y'], g.nodes[u]['x'] 
#     lat2, lon2 = g.nodes[v]['y'], g.nodes[v]['x']

#     return great_circle((lat1, lon1), (lat2, lon2)).meters

# def get_route(start: tuple, end: tuple, full_graph: nx.MultiDiGraph) -> list:
#     """
#     Finds bounding box, the nearest nodes, then computes the route using A*.

#     :param start: tuple, A start coordinates.
#     :param end: tuple, An end coordinates.
#     :param full_graph: nx.MultiDiGraph, The Ukraine road network graph.
#     :return: list, A route to follow.
#     """
#     obstacles = set()

#     with open('obstacles.csv', 'r', encoding='utf-8') as f:
#         reader = csv.reader(f)

#         for row in reader:
#             if row:
#                 obstacles.add(int(row[0]))

#     distance_km = great_circle(start, end).km
#     margin_km = max(1, distance_km * 0.2)
#     margin_deg = margin_km / 111.0бб

#     north = max(start[0], end[0]) + margin_deg
#     south = min(start[0], end[0]) - margin_deg
#     east = max(start[1], end[1]) + margin_deg
#     west = min(start[1], end[1]) - margin_deg

#     nodes_to_keep = [
#         node for node, data in full_graph.nodes(data=True)
#         if south <= data['y'] <= north and west <= data['x'] <= east and node not in obstacles
#     ]
#     subgraph = full_graph.subgraph(nodes_to_keep).copy()

#     if not subgraph.nodes:
#         raise ValueError('No data in the specified area.')

#     start_node = ox.distance.nearest_nodes(subgraph, start[1], start[0])
#     end_node = ox.distance.nearest_nodes(subgraph, end[1], end[0])

#     route = nx.astar_path(
#         subgraph,
#         start_node,
#         end_node,
#         heuristic=lambda u, v: heuristic(u, v, subgraph),
#         weight='length'
#     )

#     return [(subgraph.nodes[node]['y'], subgraph.nodes[node]['x']) for node in route]
# routing.py

import csv
import math
import heapq
import osmnx as ox
import networkx as nx


def load_ukraine_graph(path: str) -> nx.MultiDiGraph:
    """
    Loads the Ukraine road network from a GraphML file.
    
    :param path: str, Path to the GraphML file.
    :return: nx.MultiDiGraph, Ukraine road network graph.
    """
    return ox.load_graphml(path)


def haversine_distance(node1, node2, G) -> float:
    """
    Calculates the Haversine distance between two nodes in meters.

    :param node1: Node ID.
    :param node2: Node ID.
    :param G: Graph.
    :return: Distance in meters.
    """
    lat1, lon1 = G.nodes[node1]['y'], G.nodes[node1]['x']
    lat2, lon2 = G.nodes[node2]['y'], G.nodes[node2]['x']

    R = 6371000  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def custom_astar_algorithm(G, start_node, end_node, obstacles=None):
    """
    A* algorithm implementation with support for obstacles.

    :param G: Graph.
    :param start_node: Starting node ID.
    :param end_node: Ending node ID.
    :param obstacles: Set of node IDs to avoid.
    :return: (path, total distance)
    """
    if obstacles is None:
        obstacles = set()
    else:
        obstacles = set(obstacles)

    open_set = []
    closed_set = set()

    g_score = {node: float('inf') for node in G.nodes()}
    g_score[start_node] = 0

    f_score = {node: float('inf') for node in G.nodes()}
    f_score[start_node] = haversine_distance(start_node, end_node, G)

    came_from = {}

    heapq.heappush(open_set, (f_score[start_node], start_node))

    while open_set:
        current_f, current_node = heapq.heappop(open_set)

        if current_node == end_node:
            path = []
            while current_node in came_from:
                path.append(current_node)
                current_node = came_from[current_node]
            path.append(start_node)
            path.reverse()

            total_distance = 0
            for i in range(len(path) - 1):
                try:
                    edge_data = G.get_edge_data(path[i], path[i + 1])
                    min_edge = min(edge_data.values(), key=lambda x: x.get('length', float('inf')))
                    total_distance += min_edge.get('length', 0)
                except (KeyError, TypeError):
                    total_distance += haversine_distance(path[i], path[i + 1], G)

            return path, total_distance

        closed_set.add(current_node)

        for neighbor in G.neighbors(current_node):
            if neighbor in closed_set or neighbor in obstacles:
                continue

            edge_data = G.get_edge_data(current_node, neighbor)
            min_edge = min(edge_data.values(), key=lambda x: x.get('length', float('inf')))
            edge_length = min_edge.get('length', haversine_distance(current_node, neighbor, G))

            tentative_g_score = g_score[current_node] + edge_length

            if tentative_g_score < g_score[neighbor]:
                came_from[neighbor] = current_node
                g_score[neighbor] = tentative_g_score
                f_score[neighbor] = g_score[neighbor] + haversine_distance(neighbor, end_node, G)

                if not any(node == neighbor for _, node in open_set):
                    heapq.heappush(open_set, (f_score[neighbor], neighbor))

    return None, None


def get_route(start: tuple, end: tuple, full_graph: nx.MultiDiGraph) -> list:
    """
    Finds a route from start to end coordinates avoiding obstacles.

    :param start: (latitude, longitude)
    :param end: (latitude, longitude)
    :param full_graph: Ukraine road network graph.
    :return: List of (latitude, longitude) for the route.
    """
    obstacles = set()

    with open('obstacles.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            if row:
                obstacles.add(int(row[0]))

    distance_km = haversine_distance_coords(start, end) / 1000
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

    path, _ = custom_astar_algorithm(subgraph, start_node, end_node, obstacles)

    if path is None:
        raise ValueError('No route found.')

    return [(subgraph.nodes[node]['y'], subgraph.nodes[node]['x']) for node in path]


def haversine_distance_coords(coord1, coord2) -> float:
    """
    Calculates the Haversine distance between two coordinates in meters.

    :param coord1: (lat, lon)
    :param coord2: (lat, lon)
    :return: Distance in meters.
    """
    lat1, lon1 = coord1
    lat2, lon2 = coord2

    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c
