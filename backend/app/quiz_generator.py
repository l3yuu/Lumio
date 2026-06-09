import io
import os
import json
import logging
import re
import pypdf
from pydantic import BaseModel
from typing import List, Optional
from .config import settings

logger = logging.getLogger("lumio.quiz_generator")

class QuizQuestionItem(BaseModel):
    question: str
    options: List[str]
    correct_answer_index: int

class QuizSchema(BaseModel):
    questions: List[QuizQuestionItem]

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text content from a binary PDF file."""
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = pypdf.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        return ""


def clean_extracted_text(text: str) -> str:
    """Cleans up common PDF extraction artifacts like extra spaces and single-word line breaks."""
    text = re.sub(r' {2,}', ' ', text)
    text = re.sub(r'\n ', '\n', text)
    text = re.sub(r' \n', '\n', text)
    text = re.sub(r'(\w)\n(\w)', r'\1 \2', text)
    return text.strip()


def generate_mock_questions(module_name: str) -> List[dict]:
    """Generates 10 high-quality mock questions as a local fallback."""
    logger.info(f"Generating mock questions as fallback for module: {module_name}")
    return [
        {
            "question": f"What is the primary objective of studying '{module_name}'?",
            "options": ["Comprehensive mastery of core concepts", "Rote memorization of terms", "Superficial review of chapter headings", "Ignoring external applications"],
            "correct_answer_index": 0
        },
        {
            "question": f"Which study method is most effective for retaining '{module_name}' concepts?",
            "options": ["Passive reading", "Active recall and spaced repetition", "Cramming the night before", "Highlighting entire pages"],
            "correct_answer_index": 1
        },
        {
            "question": f"What represents a key milestone in learning '{module_name}'?",
            "options": ["Failing to practice quizzes", "Explaining the topic in your own words to someone else", "Keeping notes in a closed folder", "Postponing exercises indefinitely"],
            "correct_answer_index": 1
        },
        {
            "question": f"How does '{module_name}' connect to broader academic frameworks?",
            "options": ["It serves as an isolated factoid", "It provides a foundational building block for advanced topics", "It contradicts all known scientific research", "It is purely theoretical with zero application"],
            "correct_answer_index": 1
        },
        {
            "question": f"Which of the following is a common misconception about '{module_name}'?",
            "options": ["It requires consistent study habits", "It can be fully mastered in a single 5-minute session", "It benefits from mock practice exams", "It is interdisciplinary in nature"],
            "correct_answer_index": 1
        },
        {
            "question": f"What is the role of structured feedback in learning '{module_name}'?",
            "options": ["To identify knowledge gaps and focus study efforts", "To discourage students from trying again", "To enforce strict grade penalties", "To replace study materials entirely"],
            "correct_answer_index": 0
        },
        {
            "question": f"Which cognitive skill is most engaged when analyzing '{module_name}'?",
            "options": ["Critical thinking and synthesis", "Simple audio recognition", "Repetitive handwriting", "Subconscious pattern ignore"],
            "correct_answer_index": 0
        },
        {
            "question": f"How can a student optimize their workspace when studying '{module_name}'?",
            "options": ["Study in a noisy, distracting environment", "Maintain a clean, quiet, and dedicated study zone", "Keep multiple social media tabs open", "Study while multitasking other chores"],
            "correct_answer_index": 1
        },
        {
            "question": f"What is a primary benefit of collaborative circles in mastering '{module_name}'?",
            "options": ["Sharing answers without studying", "Discussing difficult concepts and teaching peers", "Reducing individual streak count", "Avoiding practice quiz reviews"],
            "correct_answer_index": 1
        },
        {
            "question": f"How should a student react when encountering a difficult topic in '{module_name}'?",
            "options": ["Break it down into smaller parts and query the AI tutor", "Skip the topic and hope it is not on the exam", "Abandon the study session entirely", "Memorize the text without understanding it"],
            "correct_answer_index": 0
        }
    ]

def generate_quiz_questions(module_name: str, text_content: Optional[str] = None, file_bytes: Optional[bytes] = None, file_filename: Optional[str] = None) -> tuple:
    """
    Generates 10 multiple choice questions.
    Attempts to use Gemini API if text content is available and GEMINI_API_KEY is configured.
    Falls back to generate_mock_questions otherwise.
    Returns (questions, extracted_text) tuple.
    """
    # 1. Extract text if a file was provided
    extracted_text = ""
    if file_bytes:
        if file_filename and file_filename.lower().endswith('.pdf'):
            logger.info("Extracting text from uploaded PDF file")
            extracted_text = extract_text_from_pdf(file_bytes)
        else:
            # Fallback for plain text files
            try:
                logger.info("Decoding uploaded text file")
                extracted_text = file_bytes.decode('utf-8', errors='ignore')
            except Exception as e:
                logger.error(f"Failed to decode file: {str(e)}")
                
    # 2. Append pasted text if available
    if text_content:
        extracted_text = (extracted_text + "\n\n" + text_content).strip()

    # Clean up PDF extraction artifacts
    extracted_text = clean_extracted_text(extracted_text)

    # 3. Check for API key
    api_key = settings.GEMINI_API_KEY
    key_preview = f"{api_key[:6]}...{api_key[-4:]}" if api_key else "None"
    print(f"DEBUG: Loaded GEMINI_API_KEY = {key_preview} (len={len(api_key) if api_key else 0})")
    print(f"DEBUG: Extracted text length = {len(extracted_text)}")
    
    if not api_key or api_key == "YOUR_GEMINI_API_KEY" or not extracted_text:
        if not api_key:
            logger.warning("GEMINI_API_KEY is not set. Using local mock questions fallback.")
            print("DEBUG: GEMINI_API_KEY is not set. Using local mock questions fallback.")
        elif not extracted_text:
            logger.warning("No study content extracted. Using local mock questions fallback.")
            print("DEBUG: No study content extracted. Using local mock questions fallback.")
        return generate_mock_questions(module_name), extracted_text

    # 4. Invoke Gemini API
    try:
        from google import genai
        from google.genai import types

        logger.info(f"Connecting to Gemini API to generate quiz for module: {module_name}")
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
You are an expert academic tutor.
Analyze the study text provided below and generate exactly 10 high-quality multiple choice questions (MCQs) to test a student's comprehension.
Each question must satisfy these requirements:
- Have exactly 4 options.
- Have exactly 1 correct option index (0 for first, 1 for second, 2 for third, 3 for fourth).
- Be directly based on the facts and information present in the text.
- Be clear, unambiguous, and educational.

Study material text:
---
{extracted_text[:12000]}
---
"""
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=QuizSchema,
                temperature=0.2,
            )
        )
        
        # Parse output
        if response.text:
            data = json.loads(response.text)
            questions_list = data.get("questions", [])
            if len(questions_list) > 0:
                logger.info(f"Successfully generated {len(questions_list)} questions using Gemini API")
                formatted_questions = []
                for q in questions_list:
                    formatted_questions.append({
                        "question": q.get("question"),
                        "options": q.get("options"),
                        "correct_answer_index": q.get("correct_answer_index")
                    })
                return formatted_questions[:10], extracted_text

        logger.warning("Gemini API returned an empty or invalid response. Falling back to mock questions.")
        return generate_mock_questions(module_name), extracted_text

    except Exception as e:
        logger.error(f"Exception during Gemini API call: {str(e)}")
        return generate_mock_questions(module_name), extracted_text
