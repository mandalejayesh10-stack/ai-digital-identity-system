import json
import logging
import re
import urllib.request
from typing import Dict, Any, List, Tuple
from app.config import settings
from app.services.vector_store import vector_store_service
from app.services.graph_store import graph_store_service

logger = logging.getLogger(__name__)

class AgentWorkflowService:
    @staticmethod
    def process_document(document_id: int, file_name: str, file_type: str, text: str) -> Dict[str, Any]:
        """
        Ingestion pipeline using LLM (OpenAI/Gemini) or robust rule-based fallback.
        """
        logger.info(f"Starting agent processing for document {document_id} ({file_name})...")
        
        if not text.strip():
            logger.warning("Empty text received for processing.")
            return {
                "summary": "Empty document.",
                "overall_score": 0.0,
                "skills": [],
                "timeline_events": []
            }
            
        extracted_data = None
        
        # 1. Try OpenAI if configured
        if settings.is_openai_configured:
            try:
                extracted_data = AgentWorkflowService._process_with_openai(text, file_type)
            except Exception as e:
                logger.error(f"OpenAI processing failed, trying Gemini: {e}")
                
        # 2. Try Gemini (Free Tier) if configured and OpenAI wasn't used/failed
        if not extracted_data and settings.is_gemini_configured:
            try:
                extracted_data = AgentWorkflowService._process_with_gemini(text, file_type)
            except Exception as e:
                logger.error(f"Gemini processing failed, falling back to rules: {e}")
                
        # 3. Fallback to Rule-based parsing
        if not extracted_data:
            extracted_data = AgentWorkflowService._process_with_rules(text, file_name, file_type)
            
        # Store Embeddings in Qdrant
        chunks = [p.strip() for p in re.split(r'\n\s*\n', text) if len(p.strip()) > 50]
        if not chunks:
            chunks = [text]
            
        vector_store_service.add_document_chunks(
            document_id=document_id,
            chunks=chunks,
            metadata={"document_name": file_name, "file_type": file_type}
        )
        
        # Store in Neo4j Knowledge Graph
        graph_store_service.add_node("Document", file_name, {
            "document_id": document_id,
            "file_type": file_type,
            "score": extracted_data["overall_score"]
        })
        
        # Add Skills
        for skill in extracted_data["skills"]:
            skill_name = skill["name"]
            graph_store_service.add_node("Skill", skill_name, {
                "category": skill["category"],
                "level": skill["level"]
            })
            graph_store_service.add_relationship("Document", file_name, "Skill", skill_name, "HAS_SKILL")
            
        # Add Skill Relationships
        for rel in extracted_data.get("skill_relationships", []):
            graph_store_service.add_relationship("Skill", rel["source"], "Skill", rel["target"], rel.get("relationship_type", "RELATED_TO"))
            
        # Add Timeline Events
        for event in extracted_data["timeline_events"]:
            event_title = event["title"]
            graph_store_service.add_node("Event", event_title, {
                "year": event["event_year"],
                "category": event["category"],
                "description": event["description"]
            })
            graph_store_service.add_relationship("Document", file_name, "Event", event_title, "CONTAINS_EVENT")
            
        return extracted_data

    @staticmethod
    def _process_with_openai(text: str, file_type: str) -> Dict[str, Any]:
        """
        Structured extraction using OpenAI.
        """
        logger.info("Processing document with OpenAI LLM...")
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        prompt = AgentWorkflowService._get_extraction_prompt(text, file_type)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        
        content = response.choices[0].message.content.strip()
        return AgentWorkflowService._clean_json_response(content)

    @staticmethod
    def _process_with_gemini(text: str, file_type: str) -> Dict[str, Any]:
        """
        Structured extraction using Google Gemini API (Free Tier, dependency-free).
        """
        logger.info("Processing document with Google Gemini LLM...")
        prompt = AgentWorkflowService._get_extraction_prompt(text, file_type)
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        data = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        req = urllib.request.Request(
            url, 
            data=json.dumps(data).encode("utf-8"), 
            headers=headers,
            method="POST"
        )
        
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode("utf-8"))
            content = res["candidates"][0]["content"]["parts"][0]["text"].strip()
            return AgentWorkflowService._clean_json_response(content)

    @staticmethod
    def _get_extraction_prompt(text: str, file_type: str) -> str:
        return f"""
        You are an expert AI recruiter and career analyst. Analyze the following document text (which is a {file_type}) and extract structured information.
        
        Document Content:
        \"\"\"
        {text}
        \"\"\"
        
        Provide your response in raw JSON format matching the following schema EXACTLY.
        
        Schema:
        {{
            "summary": "A high-level 2-3 sentence professional summary of this document.",
            "overall_score": 85.5, // A float score out of 100 assessing the career value (e.g. resume strength, project complexity, certification value)
            "skills": [
                {{"name": "Python", "category": "language", "level": "Expert"}}, // category should be: language, framework, database, tool, concept. level: Beginner, Intermediate, Expert
                ...
            ],
            "timeline_events": [
                {{
                    "title": "Software Engineering Intern at Google",
                    "description": "Designed and implemented scalable backend microservices using FastAPI.",
                    "event_date": "2024-06-01", // YYYY-MM-DD format if available, otherwise null
                    "event_year": 2024, // 4-digit year (integer)
                    "category": "work" // work, education, project, certification, award
                }},
                ...
            ],
            "skill_relationships": [
                {{"source": "FastAPI", "target": "Python", "relationship_type": "PREREQUISITE_OF"}}, // relationship_type: USED_WITH, RELATED_TO, PREREQUISITE_OF
                ...
            ]
        }}
        """

    @staticmethod
    def _clean_json_response(content: str) -> Dict[str, Any]:
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
        return json.loads(content)

    @staticmethod
    def _process_with_rules(text: str, file_name: str, file_type: str) -> Dict[str, Any]:
        """
        Rule-based fallback parser using regex and keyword search.
        """
        logger.info("Processing document with rule-based fallback...")
        summary = f"Parsed {file_type.capitalize()} document titled '{file_name}' containing professional history."
        score = 75.0
        
        lines = [line.strip() for line in text.split('\n') if len(line.strip()) > 30]
        if len(lines) > 2:
            summary = f"Uploaded {file_type.capitalize()} for '{file_name}'. Highlights: " + " ".join(lines[:2])
            if len(summary) > 200:
                summary = summary[:197] + "..."
                
        score += min(len(text) / 100, 20.0)
        if "expert" in text.lower() or "lead" in text.lower():
            score += 5.0
        
        skill_db = {
            "Python": ("language", "Expert"),
            "JavaScript": ("language", "Expert"),
            "TypeScript": ("language", "Intermediate"),
            "React": ("framework", "Expert"),
            "Next.js": ("framework", "Expert"),
            "FastAPI": ("framework", "Expert"),
            "Node.js": ("framework", "Intermediate"),
            "PostgreSQL": ("database", "Intermediate"),
            "MongoDB": ("database", "Intermediate"),
            "Qdrant": ("database", "Intermediate"),
            "Neo4j": ("database", "Intermediate"),
            "Tailwind CSS": ("tool", "Expert"),
            "Docker": ("tool", "Intermediate"),
            "Git": ("tool", "Expert"),
            "Kubernetes": ("tool", "Beginner"),
            "Machine Learning": ("concept", "Intermediate"),
            "Data Science": ("concept", "Intermediate"),
            "AWS": ("tool", "Intermediate")
        }
        
        extracted_skills = []
        for skill_name, (cat, lvl) in skill_db.items():
            pattern = r'\b' + re.escape(skill_name) + r'\b'
            if re.search(pattern, text, re.IGNORECASE):
                extracted_skills.append({
                    "name": skill_name,
                    "category": cat,
                    "level": lvl
                })
                
        if not extracted_skills:
            extracted_skills = [
                {"name": "Python", "category": "language", "level": "Intermediate"},
                {"name": "Git", "category": "tool", "level": "Intermediate"}
            ]
            
        timeline_events = []
        year_matches = re.findall(r'\b(20\d{2})\b', text)
        years = sorted(list(set([int(y) for y in year_matches])))
        
        sentences = re.split(r'[.!?\n]', text)
        for year in years:
            for sentence in sentences:
                if str(year) in sentence and len(sentence.strip()) > 20:
                    clean_sentence = sentence.strip()
                    cat = "project"
                    if any(w in clean_sentence.lower() for w in ["work", "experience", "intern", "job", "engineer", "developer", "manager"]):
                        cat = "work"
                    elif any(w in clean_sentence.lower() for w in ["university", "college", "school", "degree", "bs", "ms", "btech"]):
                        cat = "education"
                    elif any(w in clean_sentence.lower() for w in ["certified", "certificate", "certification", "course"]):
                        cat = "certification"
                    elif any(w in clean_sentence.lower() for w in ["award", "won", "prize", "hackathon", "first"]):
                        cat = "award"
                        
                    timeline_events.append({
                        "title": f"Milestone in {year}",
                        "description": clean_sentence[:150] + ("..." if len(clean_sentence) > 150 else ""),
                        "event_date": f"{year}-06-01",
                        "event_year": year,
                        "category": cat
                    })
                    break
                    
        if not timeline_events:
            timeline_events = [{
                "title": f"Uploaded {file_type.capitalize()}",
                "description": f"Successfully integrated {file_name} into the AI Career System.",
                "event_date": "2026-01-01",
                "event_year": 2026,
                "category": "project"
            }]
            
        skill_relationships = []
        skill_names = [s["name"] for s in extracted_skills]
        if "FastAPI" in skill_names and "Python" in skill_names:
            skill_relationships.append({"source": "FastAPI", "target": "Python", "relationship_type": "PREREQUISITE_OF"})
        if "React" in skill_names and "JavaScript" in skill_names:
            skill_relationships.append({"source": "React", "target": "JavaScript", "relationship_type": "PREREQUISITE_OF"})
        if "Next.js" in skill_names and "React" in skill_names:
            skill_relationships.append({"source": "Next.js", "target": "React", "relationship_type": "PREREQUISITE_OF"})
            
        return {
            "summary": summary,
            "overall_score": round(score, 1),
            "skills": extracted_skills,
            "timeline_events": timeline_events,
            "skill_relationships": skill_relationships
        }

    @staticmethod
    def answer_query_with_rag(query: str, db_documents: List[Any]) -> Tuple[str, List[Dict[str, Any]]]:
        """
        RAG Agent. Searches vector store and synthesizes answers using OpenAI, Gemini, or local fallback.
        """
        logger.info(f"Answering query with RAG: '{query}'")
        relevant_chunks = vector_store_service.search_similar_chunks(query, limit=4)
        
        context_parts = []
        cited_docs = []
        seen_docs = set()
        
        for chunk in relevant_chunks:
            doc_id = chunk.get("document_id")
            doc_name = chunk.get("document_name", "Unknown Document")
            context_parts.append(f"Source: {doc_name}\nContent: {chunk['text']}")
            
            if doc_id not in seen_docs:
                cited_docs.append({
                    "id": doc_id,
                    "name": doc_name,
                    "file_type": chunk.get("file_type", "document")
                })
                seen_docs.add(doc_id)
                
        context_str = "\n\n".join(context_parts)
        
        # 1. Try OpenAI if configured
        if settings.is_openai_configured and context_str:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                prompt = AgentWorkflowService._get_rag_prompt(context_str, query)
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2
                )
                return response.choices[0].message.content.strip(), cited_docs
            except Exception as e:
                logger.error(f"OpenAI RAG failed: {e}")
                
        # 2. Try Gemini (Free Tier) if configured
        if settings.is_gemini_configured and context_str:
            try:
                prompt = AgentWorkflowService._get_rag_prompt(context_str, query)
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                headers = {"Content-Type": "application/json"}
                data = {
                    "contents": [{"parts": [{"text": prompt}]}]
                }
                req = urllib.request.Request(
                    url, 
                    data=json.dumps(data).encode("utf-8"), 
                    headers=headers,
                    method="POST"
                )
                with urllib.request.urlopen(req) as response:
                    res = json.loads(response.read().decode("utf-8"))
                    answer = res["candidates"][0]["content"]["parts"][0]["text"].strip()
                    return answer, cited_docs
            except Exception as e:
                logger.error(f"Gemini RAG failed: {e}")
                
        # 3. Fallback to Rule-based RAG
        if not context_str:
            answer = "I couldn't find any relevant documents in your digital identity profile to answer that question. Please upload your resume, certificates, or projects first."
        else:
            citations = ", ".join([d["name"] for d in cited_docs])
            answer = f"Based on your uploaded documents ({citations}), here is what I found:\n\n"
            for chunk in relevant_chunks:
                text_snippet = chunk['text'].strip().replace('\n', ' ')
                if len(text_snippet) > 120:
                    text_snippet = text_snippet[:120] + "..."
                answer += f"- From **{chunk['document_name']}**: \"{text_snippet}\"\n"
            answer += "\nIs there anything specific you would like me to detail from these records?"
            
        return answer, cited_docs

    @staticmethod
    def _get_rag_prompt(context: str, query: str) -> str:
        return f"""
        You are an expert career assistant. Answer the user's question based ONLY on the provided document contexts.
        Cite the sources (document names) in your answer where appropriate.
        
        Context:
        \"\"\"
        {context}
        \"\"\"
        
        Question: {query}
        
        Answer:
        """
