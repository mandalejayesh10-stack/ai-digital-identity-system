import os
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class ParserService:
    @staticmethod
    def parse_file(file_path: str) -> str:
        """
        Parses a file and extracts its text.
        If LlamaParse is configured, uses LlamaParse.
        Otherwise, falls back to local PyPDF2 parser.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        file_ext = os.path.splitext(file_path)[1].lower()
        
        # If it's a plain text file, read it directly
        if file_ext in ['.txt', '.md', '.json']:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            except Exception as e:
                logger.error(f"Error reading text file: {e}")
                return ""
                
        # If LlamaParse is configured and it's a PDF/Docx
        if settings.is_llamaparse_configured and file_ext in ['.pdf', '.docx', '.pptx']:
            try:
                logger.info(f"Parsing {file_path} using LlamaParse...")
                from llama_parse import LlamaParse
                
                parser = LlamaParse(
                    api_key=settings.LLAMA_CLOUD_API_KEY,
                    result_type="markdown",
                    verbose=True
                )
                
                documents = parser.load_data(file_path)
                text = "\n\n".join([doc.text for doc in documents])
                return text
            except Exception as e:
                logger.error(f"LlamaParse failed, falling back to local parser: {e}")
                
        # Fallback to local PDF Parser
        if file_ext == '.pdf':
            return ParserService._parse_pdf_local(file_path)
        else:
            logger.warning(f"Unsupported file type for local parsing: {file_ext}. Attempting text read.")
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()
            except Exception as e:
                logger.error(f"Fallback text read failed: {e}")
                return ""

    @staticmethod
    def _parse_pdf_local(file_path: str) -> str:
        """
        Extracts text from a PDF file using PyPDF2.
        """
        logger.info(f"Parsing {file_path} using local PyPDF2 fallback...")
        text = ""
        try:
            import PyPDF2
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page_num in range(len(reader.pages)):
                    page = reader.pages[page_num]
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return text
        except Exception as e:
            logger.error(f"Local PDF parsing failed: {e}")
            return ""

parser_service = ParserService()
