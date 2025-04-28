import osmnx as ox

ukraine_graph = ox.graph_from_place("Lviv, Ukraine", network_type="drive")
ox.save_graphml(ukraine_graph, "ukraine_drive.graphml")
