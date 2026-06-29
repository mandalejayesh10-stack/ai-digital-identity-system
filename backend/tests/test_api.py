import os
import unittest
import json
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.config import settings

class TestAIDigitalIdentityAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Use an isolated SQLite database for testing
        cls.test_db_path = "./test_sql_app.db"
        settings.DATABASE_URL = f"sqlite:///{cls.test_db_path}"
        
        # Re-create tables in test database
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        
        cls.client = TestClient(app)
        
    @classmethod
    def tearDownClass(cls):
        # Close connection and remove test database file
        engine.dispose()
        if os.path.exists(cls.test_db_path):
            os.remove(cls.test_db_path)

    def test_1_dashboard_stats_initial_seeding(self):
        """
        Test that dashboard stats automatically seeds the database on first load.
        """
        response = self.client.get("/api/v1/dashboard/stats")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify seeded counts
        self.assertGreater(data["total_documents"], 0)
        self.assertGreater(data["total_skills"], 0)
        self.assertGreater(data["total_events"], 0)
        self.assertTrue(any(s["name"] == "Python" for s in data["top_skills"]))

    def test_2_get_documents(self):
        """
        Test retrieving the list of seeded documents.
        """
        response = self.client.get("/api/v1/documents/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 3)  # Resume, Certificate, Project
        self.assertEqual(data[0]["status"], "completed")

    def test_3_get_timeline(self):
        """
        Test retrieving chronological timeline events.
        """
        response = self.client.get("/api/v1/timeline/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(len(data), 0)
        
        # Verify chronological order (ascending years)
        years = [event["event_year"] for event in data]
        self.assertEqual(years, sorted(years))

    def test_4_get_skill_graph(self):
        """
        Test retrieving skill graph data.
        """
        response = self.client.get("/api/v1/skills/graph")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("nodes", data)
        self.assertIn("edges", data)
        self.assertGreater(len(data["nodes"]), 0)

    def test_5_rag_search(self):
        """
        Test RAG search chatbot endpoint.
        """
        payload = {"question": "What skills did I use in my AI Resume Analyzer project?"}
        response = self.client.post("/api/v1/search/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("answer", data)
        self.assertIn("relevant_documents", data)
        
        # Since we seeded data, it should cite the project document
        self.assertTrue(any("AI_Resume_Analyzer" in doc["name"] for doc in data["relevant_documents"]))

if __name__ == "__main__":
    unittest.main()
