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
    """Extracts text content from a binary PDF file using layout mode if supported."""
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = pypdf.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            try:
                extracted = page.extract_text(extraction_mode="layout")
            except Exception:
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


def strip_module_boilerplate(text: str, module_name: str = "") -> str:
    """Prefer lesson body text over covers, tables of contents, and module metadata."""
    if not text:
        return ""

    module_words = {w.lower() for w in re.findall(r"[a-zA-Z]{4,}", module_name)}
    boilerplate_patterns = [
        r"^\s*(module|unit|chapter)\s*\d*[:.\-\s]*$",
        r"^\s*(overview|introduction|table of contents|contents|learning objectives?)\s*$",
        r"^\s*(what is this module about|about this module|module description)\s*$",
        r"^\s*(at the end of this module|after studying this module|in this module,? you will)\b",
        r"^\s*(page|lesson)\s+\d+\s*$",
    ]

    cleaned_lines = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if len(line) < 20:
            continue
        lower = line.lower()
        if any(re.search(pattern, lower) for pattern in boilerplate_patterns):
            continue

        words = re.findall(r"[a-zA-Z]{3,}", lower)
        if words:
            module_word_hits = sum(1 for word in words if word in module_words)
            if module_words and module_word_hits / max(len(words), 1) > 0.35:
                continue

        cleaned_lines.append(line)

    cleaned = "\n".join(cleaned_lines)
    return re.sub(r"\n{3,}", "\n\n", cleaned).strip()


def build_lesson_excerpt(text: str, module_name: str = "", max_chars: int = 12000) -> str:
    """Build an excerpt weighted toward teachable lesson facts instead of front matter."""
    lesson_text = strip_module_boilerplate(text, module_name)
    if len(lesson_text) <= max_chars:
        return lesson_text

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", lesson_text) if len(p.strip()) >= 80]
    scored_paragraphs = []
    concept_markers = re.compile(
        r"\b(is|are|means|refers to|defined as|because|therefore|process|function|cause|effect|"
        r"example|types?|components?|characteristics?|advantages?|disadvantages?|steps?|role)\b",
        re.IGNORECASE,
    )
    for index, paragraph in enumerate(paragraphs):
        words = re.findall(r"[A-Za-z]{4,}", paragraph)
        unique_ratio = len(set(w.lower() for w in words)) / max(len(words), 1)
        score = min(len(paragraph), 900) + (200 if concept_markers.search(paragraph) else 0) + int(unique_ratio * 100)
        # Do not heavily penalize later paragraphs so that actual lessons in the middle/end are not discarded.
        # We apply a very small decay to break ties in favor of earlier content, but not enough to dominate.
        score -= int(index * 0.1)
        scored_paragraphs.append((score, index, paragraph))

    selected = sorted(scored_paragraphs, reverse=True)[:24]
    selected.sort(key=lambda item: item[1])

    excerpt = ""
    for _, _, paragraph in selected:
        if len(excerpt) + len(paragraph) + 2 > max_chars:
            break
        excerpt += paragraph + "\n\n"

    return excerpt.strip() or lesson_text[:max_chars]


def extract_study_sentences(text: str, limit: int = 10) -> List[str]:
    """Pull factual-looking sentences for local fallback questions."""
    sentences = re.split(r"(?<=[.!?])\s+", text.replace("\n", " "))
    candidates = []
    for sentence in sentences:
        sentence = re.sub(r"\s+", " ", sentence).strip()
        if not 60 <= len(sentence) <= 260:
            continue
        if sentence.count(",") > 8:
            continue
        if re.search(r"\b(module|lesson|page|activity|directions?)\b", sentence, re.IGNORECASE):
            continue
        if re.search(r"\b(is|are|means|refers to|because|therefore|process|function|cause|effect|consists of)\b", sentence, re.IGNORECASE):
            candidates.append(sentence)
        if len(candidates) >= limit:
            break
    return candidates


def generate_mock_questions(module_name: str, text_content: Optional[str] = None, num_questions: int = 10) -> List[dict]:
    """Generates fallback questions, using lesson content when available."""
    logger.info(f"Generating mock questions as fallback for module: {module_name}")
    study_sentences = extract_study_sentences(build_lesson_excerpt(text_content or "", module_name, max_chars=8000))
    questions = []
    for index, sentence in enumerate(study_sentences[:num_questions]):
        questions.append({
            "question": f"According to the lesson, which statement is accurate?",
            "options": [
                sentence,
                f"The lesson says this topic is only about the module title, not its content.",
                "The lesson states that definitions and examples are not important for understanding.",
                "The lesson presents the topic as unrelated to any real concept or process."
            ],
            "correct_answer_index": 0
        })

    generic_questions = [
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
    return (questions + generic_questions * 3)[:num_questions]

def generate_quiz_questions(module_name: str, text_content: Optional[str] = None, file_bytes: Optional[bytes] = None, file_filename: Optional[str] = None, difficulty: str = "medium", num_questions: int = 10) -> tuple:
    """
    Generates the requested number of multiple choice questions.
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
        return generate_mock_questions(module_name, extracted_text, num_questions), extracted_text

    # 4. Invoke Gemini API
    try:
        from google import genai
        from google.genai import types

        logger.info(f"Connecting to Gemini API to generate quiz for module: {module_name} with difficulty {difficulty}")
        client = genai.Client(api_key=api_key)
        
        difficulty_instructions = {
            "easy": "The quiz must be EASY difficulty. Focus on simple direct recall of facts, core definitions, key terminology, and explicit vocabulary stated directly in the text. Options should be simple and easy to distinguish.",
            "medium": "The quiz must be MEDIUM difficulty. Focus on conceptual understanding, identifying steps in processes, explaining relationships between concepts, and explaining how or why things function.",
            "hard": "The quiz must be HARD difficulty. Focus on deep critical evaluation, scenario-based applications of concepts, complex multi-step reasoning, logical deductions, and subtle comparisons or contradictions in the text."
        }.get(difficulty.lower(), "Focus on conceptual understanding and explaining relationships between concepts.")

        lesson_excerpt = build_lesson_excerpt(extracted_text, module_name)
        prompt = f"""
You are an expert academic tutor.
Analyze the lesson content provided below and generate exactly {num_questions} high-quality multiple choice questions (MCQs) to test a student's comprehension of what the lesson teaches.

DIFFICULTY LEVEL: {difficulty.upper()}
Instruction for this difficulty level:
{difficulty_instructions}

Each question must satisfy these requirements:
- Have exactly 4 options.
- Have exactly 1 correct option index (0 for first, 1 for second, 2 for third, 3 for fourth).
- Be directly based on facts, definitions, processes, examples, causes/effects, or comparisons present in the lesson content.
- Ask about the concepts inside the lesson, not about the module title, file, author, objectives, instructions, table of contents, or "what the module is about".
- Avoid questions that can be answered only from the module name.
- Avoid generic study-skills questions.
- Be clear, unambiguous, and educational.

Module title, for context only. Do not quiz about this title:
{module_name}

Lesson content to quiz from:
---
{lesson_excerpt[:12000]}
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
                return formatted_questions[:num_questions], extracted_text

        logger.warning("Gemini API returned an empty or invalid response. Falling back to mock questions.")
        return generate_mock_questions(module_name, extracted_text, num_questions), extracted_text

    except Exception as e:
        logger.error(f"Exception during Gemini API call: {str(e)}")
        return generate_mock_questions(module_name, extracted_text, num_questions), extracted_text
