"""Custom A* algorithm"""

import heapq
import networkx as nx

def custom_astar_algorithm(graph: nx.Graph, start_node: int, end_node: int, heuristic: 'function', weight: str) -> tuple:
    """
    A* algorithm implementation.

    :param G: Graph.
    :param start_node: Starting node ID.
    :param end_node: Ending node ID.
    :param heuristic: A heuristic function.
    :param weight: Edge attribute key to use as cost.
    :return: (path, total distance)
    """
    open_set = []
    closed_set = set()

    g_score = {node: float("inf") for node in graph.nodes()}
    g_score[start_node] = 0.0

    f_score = {node: float("inf") for node in graph.nodes()}
    f_score[start_node] = heuristic(start_node, end_node, graph)

    came_from = {}

    heapq.heappush(open_set, (f_score[start_node], start_node))

    while open_set:
        current_f, current_node = heapq.heappop(open_set)

        if current_node == end_node:
            path = [current_node]
            while current_node in came_from:
                current_node = came_from[current_node]
                path.append(current_node)
            path.reverse()

            total_distance = 0.0
            for u, v in zip(path, path[1:]):
                edge_data = graph.get_edge_data(u, v)
                best_edge = min(edge_data.values(), key=lambda e: e.get(weight, float("inf")))
                total_distance += best_edge.get(weight, 0.0)

            return path, total_distance

        closed_set.add(current_node)

        for neighbor in graph.neighbors(current_node):
            if neighbor in closed_set:
                continue

            edge_data = graph.get_edge_data(current_node, neighbor)
            best_edge = min(edge_data.values(), key=lambda e: e.get(weight, float("inf")))
            edge_length = best_edge.get(weight, 0.0)

            tentative_g_score = g_score[current_node] + edge_length

            if tentative_g_score < g_score[neighbor]:
                came_from[neighbor] = current_node
                g_score[neighbor] = tentative_g_score
                f_score[neighbor] = tentative_g_score + heuristic(neighbor, end_node, graph)

                if not any(item_node == neighbor for _, item_node in open_set):
                    heapq.heappush(open_set, (f_score[neighbor], neighbor))

    return None, None
