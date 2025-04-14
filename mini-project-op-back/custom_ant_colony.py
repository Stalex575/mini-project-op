import random


def custom_ant_colony_algorithm(
    graph,
    start,
    end,
    ant_count=15,
    iterations=75,
    alpha=1.0,
    beta=3.0,
    evaporation=0.4,
    boost=120.0,
    weight="length"
):
    def sorted_edge(u, v):
        return (u, v) if u < v else (v, u)

    pheromones = {sorted_edge(u, v): 1.0 for u, v in graph.edges}
    edge_weights = {sorted_edge(u, v): data.get(weight, 1.0) for u, v, data in graph.edges(data=True)}

    best_path = []
    best_cost = float("inf")

    for _ in range(iterations):
        paths = []
        costs = []

        for _ in range(ant_count):
            current_node = start
            visited = {current_node}
            path = [current_node]

            while current_node != end:
                neighbors = [n for n in graph.neighbors(current_node) if n not in visited]
                if not neighbors:
                    break

                scores = []
                for neighbor in neighbors:
                    edge = sorted_edge(current_node, neighbor)
                    pheromone = pheromones.get(edge, 1.0)
                    distance = edge_weights.get(edge, 1.0)

                    score = (pheromone ** alpha) * ((1 / distance) ** beta)
                    scores.append(score)

                total_score = sum(scores)
                probabilities = [s / total_score for s in scores]

                next_node = random.choices(neighbors, weights=probabilities)[0]
                path.append(next_node)
                visited.add(next_node)
                current_node = next_node

            if path[-1] == end:
                cost = sum(
                    edge_weights.get(sorted_edge(path[i], path[i + 1]), 1.0)
                    for i in range(len(path) - 1)
                )
                paths.append(path)
                costs.append(cost)

                if cost < best_cost:
                    best_path = path
                    best_cost = cost

        for edge in pheromones:
            pheromones[edge] *= (1 - evaporation)

        for path, cost in zip(paths, costs):
            pheromone_increase = boost / cost
            for i in range(len(path) - 1):
                edge = sorted_edge(path[i], path[i + 1])
                pheromones[edge] += pheromone_increase

    return best_path, best_cost
