import logging
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

class GraphStoreService:
    def __init__(self):
        self.use_real_neo4j = settings.is_neo4j_configured
        self.driver = None
        
        # In-memory fallback graph database
        self.nodes: Dict[str, Dict[str, Any]] = {}  # key: node_id (e.g., "Skill:Python"), value: {label, properties}
        self.edges: List[Dict[str, Any]] = []      # list of {source, target, type}
        
        if self.use_real_neo4j:
            try:
                from neo4j import GraphDatabase
                logger.info(f"Connecting to Neo4j at {settings.NEO4J_URI}...")
                self.driver = GraphDatabase.driver(
                    settings.NEO4J_URI,
                    auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD)
                )
                self._verify_connectivity()
            except Exception as e:
                logger.error(f"Failed to connect to Neo4j, falling back to in-memory: {e}")
                self.use_real_neo4j = False
        else:
            logger.info("Neo4j not configured. Using in-memory Graph Store...")

    def _verify_connectivity(self):
        if self.driver:
            with self.driver.session() as session:
                session.run("RETURN 1")
            logger.info("Neo4j connection verified successfully.")

    def add_node(self, label: str, name: str, properties: Dict[str, Any] = None):
        """
        Adds a node to the graph.
        """
        if properties is None:
            properties = {}
        properties['name'] = name
        node_id = f"{label}:{name.lower()}"
        
        if self.use_real_neo4j:
            try:
                query = f"MERGE (n:{label} {{name: $name}}) SET n += $props"
                with self.driver.session() as session:
                    session.run(query, name=name, props=properties)
            except Exception as e:
                logger.error(f"Neo4j add_node failed: {e}")
        else:
            # In-memory
            self.nodes[node_id] = {
                "id": node_id,
                "label": label,
                "name": name,
                "properties": properties
            }
            logger.debug(f"Added in-memory node: {node_id}")

    def add_relationship(self, source_label: str, source_name: str, 
                         target_label: str, target_name: str, 
                         relationship_type: str, properties: Dict[str, Any] = None):
        """
        Creates a directed relationship between two nodes.
        """
        if properties is None:
            properties = {}
            
        source_id = f"{source_label}:{source_name.lower()}"
        target_id = f"{target_label}:{target_name.lower()}"
        
        if self.use_real_neo4j:
            try:
                query = (
                    f"MATCH (s:{source_label} {{name: $source_name}}) "
                    f"MATCH (t:{target_label} {{name: $target_name}}) "
                    f"MERGE (s)-[r:{relationship_type}]->(t) "
                    f"SET r += $props"
                )
                with self.driver.session() as session:
                    session.run(query, source_name=source_name, target_name=target_name, props=properties)
            except Exception as e:
                logger.error(f"Neo4j add_relationship failed: {e}")
        else:
            # In-memory
            # Ensure nodes exist
            if source_id not in self.nodes:
                self.add_node(source_label, source_name)
            if target_id not in self.nodes:
                self.add_node(target_label, target_name)
                
            edge = {
                "source": source_id,
                "target": target_id,
                "type": relationship_type,
                "properties": properties
            }
            if edge not in self.edges:
                self.edges.append(edge)
                logger.debug(f"Added in-memory edge: {source_id} -> {target_id} ({relationship_type})")

    def get_graph_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Returns all nodes and edges in a format suitable for React Flow or d3.
        """
        if self.use_real_neo4j:
            try:
                nodes_list = []
                edges_list = []
                query = "MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 100"
                with self.driver.session() as session:
                    results = session.run(query)
                    seen_nodes = set()
                    for record in results:
                        n = record["n"]
                        m = record["m"]
                        r = record["r"]
                        
                        for node in [n, m]:
                            if node.element_id not in seen_nodes:
                                label = list(node.labels)[0] if node.labels else "Entity"
                                nodes_list.append({
                                    "id": node.element_id,
                                    "label": label,
                                    "name": node.get("name", "Unknown"),
                                    "properties": dict(node)
                                })
                                seen_nodes.add(node.element_id)
                                
                        edges_list.append({
                            "id": r.element_id,
                            "source": n.element_id,
                            "target": m.element_id,
                            "type": r.type,
                            "properties": dict(r)
                        })
                return {"nodes": nodes_list, "edges": edges_list}
            except Exception as e:
                logger.error(f"Neo4j get_graph_data failed: {e}")
                
        # Return in-memory data
        nodes_list = []
        for n_id, n_val in self.nodes.items():
            nodes_list.append({
                "id": n_id,
                "label": n_val["label"],
                "name": n_val["name"],
                "properties": n_val["properties"]
            })
            
        edges_list = []
        for idx, edge in enumerate(self.edges):
            edges_list.append({
                "id": f"e_{idx}",
                "source": edge["source"],
                "target": edge["target"],
                "type": edge["type"],
                "properties": edge["properties"]
            })
            
        return {"nodes": nodes_list, "edges": edges_list}

    def close(self):
        if self.driver:
            self.driver.close()

graph_store_service = GraphStoreService()
