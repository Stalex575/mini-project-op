import random
import math

def custom_ant_colony_algorithm(
    graph,
    start,
    end,
    ant_count=50,
    iterations=300,
    alpha=1.0,
    beta=5.0,
    evaporation=0.3,
    q0=0.5,
    initial_pheromone=0.1,
    elite_factor=5,
    stagnation_limit=30,
    weight="length"
):
    def sorted_edge(u, v):
        return (u, v) if u < v else (v, u)
    
    pheromones = {}
    edge_weights = {}
    
    neighbors_cache = {}
    for node in graph.nodes():
        neighbors_cache[node] = list(graph.neighbors(node))
    
    for u, v, data in graph.edges(data=True):
        edge = sorted_edge(u, v)
        current_weight = data.get(weight, 1.0)
        edge_weights[edge] = current_weight
        pheromones[edge] = initial_pheromone
    
    best_path = []
    best_cost = float("inf")
    
    last_improvement = 0
    restarts = 0
    
    heuristic_to_goal = {}
    for node in graph.nodes():
        heuristic_to_goal[node] = 1.0
        try:
            if hasattr(graph.nodes[node], 'pos') and hasattr(graph.nodes[end], 'pos'):
                n_pos = graph.nodes[node]['pos']
                e_pos = graph.nodes[end]['pos']
                dist_to_goal = math.sqrt((n_pos[0] - e_pos[0])**2 + (n_pos[1] - e_pos[1])**2)
                heuristic_to_goal[node] = max(0.1, dist_to_goal)
        except:
            pass
    
    for iteration in range(iterations):
        paths = []
        costs = []
        
        for ant in range(ant_count):
            current_node = start
            visited = {current_node}
            path = [current_node]
            path_cost = 0
            
            while current_node != end:
                neighbors = [n for n in neighbors_cache[current_node] if n not in visited]
                
                if not neighbors:
                    if len(path) > 1:
                        blocked_node = current_node
                        path.pop()
                        current_node = path[-1]
                        neighbors = [n for n in neighbors_cache[current_node] 
                                    if n not in visited and n != blocked_node]
                        if not neighbors:
                            break
                    else:
                        break
                
                transition_probs = []
                
                for neighbor in neighbors:
                    edge = sorted_edge(current_node, neighbor)
                    pheromone = pheromones.get(edge, initial_pheromone)
                    distance = edge_weights.get(edge, 1.0)
                    
                    directional_factor = 1.0 / heuristic_to_goal.get(neighbor, 1.0)
                    
                    combined_heuristic = (1.0 / distance) * directional_factor
                    
                    probability = (pheromone ** alpha) * (combined_heuristic ** beta)
                    transition_probs.append((neighbor, probability))
                
                dynamic_q0 = q0
                if iteration - last_improvement > stagnation_limit / 2:
                    dynamic_q0 = max(0.1, q0 - 0.3)
                
                if random.random() < dynamic_q0 and transition_probs:
                    next_node = max(transition_probs, key=lambda x: x[1])[0]
                else:
                    total = sum(prob for _, prob in transition_probs)
                    if total > 0:
                        rand_val = random.random() * total
                        cumulative = 0
                        for node, prob in transition_probs:
                            cumulative += prob
                            if cumulative >= rand_val:
                                next_node = node
                                break
                        else:
                            next_node = transition_probs[-1][0]
                    else:
                        next_node = random.choice(neighbors)
                
                path.append(next_node)
                edge = sorted_edge(current_node, next_node)
                path_cost += edge_weights.get(edge, 1.0)
                visited.add(next_node)
                current_node = next_node
            
            if path[-1] == end:
                paths.append(path)
                costs.append(path_cost)
                
                if path_cost < best_cost:
                    best_path = path.copy()
                    best_cost = path_cost
                    last_improvement = iteration
        
        if iteration - last_improvement > stagnation_limit:
            for edge in pheromones:
                pheromones[edge] = pheromones[edge] * 0.5 + initial_pheromone * 0.5
            
            if best_path:
                restart_pheromone = 1.0 / best_cost
                for i in range(len(best_path) - 1):
                    edge = sorted_edge(best_path[i], best_path[i + 1])
                    pheromones[edge] += restart_pheromone * 5
            
            last_improvement = iteration
            restarts += 1
        
        for edge in pheromones:
            pheromones[edge] *= (1 - evaporation)
        
        path_counter = 0
        for path, cost in zip(paths, costs):
            path_quality = best_cost / max(cost, 0.001)
            pheromone_increase = path_quality / cost
            
            if path_counter < 5:
                pheromone_increase *= (5 - path_counter)
            
            for i in range(len(path) - 1):
                edge = sorted_edge(path[i], path[i + 1])
                pheromones[edge] += pheromone_increase
            
            path_counter += 1
        
        if best_path:
            elite_pheromone = (elite_factor / best_cost) * (1 + iteration / iterations)
            for i in range(len(best_path) - 1):
                edge = sorted_edge(best_path[i], best_path[i + 1])
                pheromones[edge] += elite_pheromone
        
        max_pheromone = 1.0 / ((1 - evaporation) * max(0.01, best_cost / 100))
        min_pheromone = max_pheromone / 100.0
        
        for edge in pheromones:
            pheromones[edge] = max(min_pheromone, min(pheromones[edge], max_pheromone))
    
    return best_path, best_cost
