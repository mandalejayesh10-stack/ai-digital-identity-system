import json
import logging
import re
from typing import Dict, Any, List, Tuple
from app.config import settings
from app.services.vector_store import vector_store_service
from app.services.graph_store import graph_store_service

logger = logging.getLogger(__name__)

class AgentWorkflowService:
    @staticmethod
    def process_document(document_id: int, file_name: str, file_type: str, text: str) -> Dict[str, Any]:
        """
        Ingestion pipeline using LLM (if configured) or robust rule-based fallback.
        Extracts:
        - Summary
        - Score
        - Skills
        - Timeline Events
        - Skill Relationships
        """
        logger.info(f"Starting agent processing for document {document_id} ({file_name})...")
        
        # Step 1: Document Parser (text is already extracted by parser_service)
        if not text.strip():
            logger.warning("Empty text received for processing.")
            return {
                "summary": "Empty document.",
                "overall_score": 0.0,
                "skills": [],
                "timeline_events": []
            }
            
        # Step 2: Categorization, Skill Extraction, Timeline, and Graph construction
        extracted_data = None
        if settings.is_openai_configured:
            try:
                extracted_data = AgentWorkflowService._process_with_llm(text, file_type)
            except Exception as e:
                logger.error(f"LLM processing failed, falling back to rule-based: {e}")
                
        if not extracted_data:
            extracted_data = AgentWorkflowService._process_with_rules(text, file_name, file_type)
            
        # Step 3: Store Embeddings in Qdrant
        # Chunk text into ~1000 character paragraphs
        chunks = [p.strip() for p in re.split(r'\n\s*\n', text) if len(p.strip()) > 50]
        if not chunks:
            chunks = [text]
            
        vector_store_service.add_document_chunks(
            document_id=document_id,
            chunks=chunks,
            metadata={"document_name": file_name, "file_type": file_type}
        )
        
        # Step 4: Store in Neo4j Knowledge Graph
        # Add Document node
        graph_store_service.add_node("Document", file_name, {
            "document_id": document_id,
            "file_type": file_type,
            "score": extracted_data["overall_score"]
        })
        
        # Add Skills and Relationships
        for skill in extracted_data["skills"]:
            skill_name = skill["name"]
            skill_cat = skill["category"]
            skill_lvl = skill["level"]
            
            # Add Skill node
            graph_store_service.add_node("Skill", skill_name, {
                "category": skill_cat,
                "level": skill_lvl
            })
            # Connect Document -> HAS_SKILL -> Skill
            graph_store_service.add_relationship(
                "Document", file_name,
                "Skill", skill_name,
                "HAS_SKILL"
            )
            
        # Add Skill Relationships
        for rel in extracted_data.get("skill_relationships", []):
            graph_store_service.add_relationship(
                "Skill", rel["source"],
                "Skill", rel["target"],
                rel.get("relationship_type", "RELATED_TO")
            )
            
        # Connect Timeline Events in Graph
        for event in extracted_data["timeline_events"]:
            event_title = event["title"]
            graph_store_service.add_node("Event", event_title, {
                "year": event["event_year"],
                "category": event["category"],
                "description": event["description"]
            })
            # Connect Document -> CONTAINS_EVENT -> Event
            graph_store_service.add_relationship(
                "Document", file_name,
                "Event", event_title,
                "CONTAINS_EVENT"
            )
            
        return extracted_data

    @staticmethod
    def _process_with_llm(text: str, file_type: str) -> Dict[str, Any]:
        """
        Uses OpenAI LLM to parse and extract structured fields.
        """
        logger.info("Processing document with OpenAI LLM...")
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        prompt = f"""
        You are an expert AI recruiter and career analyst. Analyze the following document text (which is a {file_type}) and extract structured information.
        
        Document Content:
        \"\"\"
        {text}
        \"\"\"
        
        Provide your response in raw JSON format matching the following schema EXACTLY. Do not include markdown formatting or backticks around the JSON.
        
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
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        
        content = response.choices[0].message.content.strip()
        # Clean markdown wrappers if present
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
            
        return json.loads(content)

    @staticmethod
    def _process_with_rules(text: str, file_name: str, file_type: str) -> Dict[str, Any]:
        """
        Rule-based fallback parser using regex and keyword search.
        Ensures the pipeline works offline or without API keys.
        """
        logger.info("Processing document with rule-based fallback...")
        
        # 1. Summary & Score
        summary = f"Parsed {file_type.capitalize()} document titled '{file_name}' containing professional history."
        score = 75.0
        
        # Find some text to make a better summary
        lines = [line.strip() for line in text.split('\n') if len(line.strip()) > 30]
        if len(lines) > 2:
            summary = f"Uploaded {file_type.capitalize()} for '{file_name}'. Highlights: " + " ".join(lines[:2])
            if len(summary) > 200:
                summary = summary[:197] + "..."
                
        # Calculate a score based on document length and key terms
        score += min(len(text) / 100, 20.0)  # up to +20 points for detail
        if "expert" in text.lower() or "lead" in text.lower():
            score += 5.0
        
        # 2. Extract Skills using Keyword Matching
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
            # Use regex for word boundary matching
            pattern = r'\b' + re.escape(skill_name) + r'\b'
            if re.search(pattern, text, re.IGNORECASE):
                extracted_skills.append({
                    "name": skill_name,
                    "category": cat,
                    "level": lvl
                })
                
        # Add default skills if none found
        if not extracted_skills:
            extracted_skills = [
                {"name": "Python", "category": "language", "level": "Intermediate"},
                {"name": "Git", "category": "tool", "level": "Intermediate"}
            ]
            
        # 3. Extract Timeline Events (search for years 2015-2027)
        timeline_events = []
        year_matches = re.findall(r'\b(20\d{2})\b', text)
        years = sorted(list(set([int(y) for y in year_matches])))
        
        # Look for sentences containing years
        sentences = re.split(r'[.!?\n]', text)
        for year in years:
            for sentence in sentences:
                if str(year) in sentence and len(sentence.strip()) > 20:
                    clean_sentence = sentence.strip()
                    # Determine category
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
                    break  # Just take the first matching sentence for this year to avoid clutter
                    
        # Add a default event if none found
        if not timeline_events:
            timeline_events = [{
                "title": f"Uploaded {file_type.capitalize()}",
                "description": f"Successfully integrated {file_name} into the AI Career System.",
                "event_date": "2026-01-01",
                "event_year": 2026,
                "category": "project"
            }]
            
        # 4. Mock Skill Relationships
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
        RAG Agent. Searches vector store for relevant chunks,
        then uses LLM (or mock) to generate a clean response with citations.
        """
        logger.info(f"Answering query with RAG: '{query}'")
        
        # Search Qdrant for similar chunks
        relevant_chunks = vector_store_service.search_similar_chunks(query, limit=4)
        
        # Construct context
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
        
        # Generate Answer
        if settings.is_openai_configured and context_str:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                prompt = f"""
                You are an expert career assistant. Answer the user's question based ONLY on the provided document contexts.
                Cite the sources (document names) in your answer where appropriate.
                
                Context:
                \"\"\"
                {context_str}
                \"\"\"
                
                Question: {query}
                
                Answer:
                """
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2
                )
                answer = response.choices[0].message.content.strip()
                return answer, cited_docs
            except Exception as e:
                logger.error(f"OpenAI RAG generation failed: {e}")
                
        # Rule-based fallback RAG answer
        if not context_str:
            answer = "I couldn't find any relevant documents in your digital identity profile to answer that question. Please upload your resume, certificates, or projects first."
        else:
            # Create a nice synthesized answer from the matched chunks
            citations = ", ".join([d["name"] for d in cited_docs])
            answer = f"Based on your uploaded documents ({citations}), here is what I found:\n\n"
            for chunk in relevant_chunks:
                text_snippet = chunk['text'].strip().replace('\n', ' ')
                if len(text_snippet) > 120:
                    text_snippet = text_snippet[:120] + "..."
                answer += f"- From **{chunk['document_name']}**: \"{text_snippet}\"\n"
            answer += "\nIs there anything specific you would like me to detail from these records?"
            
        return answer, cited_docs
