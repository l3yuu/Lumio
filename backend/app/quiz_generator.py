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


def get_generic_study_cards() -> List[dict]:
    return [
        {"front": "Active Recall", "back": "A study method where you actively stimulate your memory for a piece of information rather than passively reviewing it."},
        {"front": "Spaced Repetition", "back": "A learning technique where reviews are spaced out over increasing intervals of time to exploit the psychological spacing effect."},
        {"front": "Feynman Technique", "back": "A mental model for learning where you explain a complex concept in simple language to identify gaps in your understanding."},
        {"front": "Pomodoro Technique", "back": "A time management method that uses a timer to break work down into intervals, traditionally 25 minutes in length, separated by short breaks."},
        {"front": "Leitner System", "back": "A widely used method of efficiently using flashcards where cards are prioritized based on how well you know them."},
        {"front": "Active recall vs Passive review", "back": "Active recall requires retrieving information from memory, strengthening neural paths. Passive review is just rereading, which creates an illusion of competence."},
        {"front": "Chunking", "back": "The process of taking individual pieces of information and grouping them into larger, meaningful units to improve memory retention."},
        {"front": "Encoding", "back": "The initial learning of information by processing and storing it in memory."},
        {"front": "Retrieval practice", "back": "The act of recalling information from memory, which makes the learning more durable and flexible."},
        {"front": "Interleaving", "back": "A study practice where you mix or alternate different topics or subjects, which helps improve long-term retention compared to blocked practice."}
    ]


def generate_mock_flashcards(text: str, count: int = 10) -> List[dict]:
    """
    Generates high-quality mock flashcards locally from input text using
    sophisticated grammar-like rule matching. No external AI APIs are called.
    """
    logger.info("Generating intelligent mock flashcards locally")
    
    clean_text = clean_extracted_text(text)
    if len(clean_text) < 40 or len(clean_text.split()) < 8:
        return get_generic_study_cards()[:count]

    raw_sentences = re.split(r"(?<=[.!?])\s+", clean_text.replace("\n", " "))
    sentences = []
    for s in raw_sentences:
        s = re.sub(r"\s+", " ", s).strip()
        if len(s) >= 15 and len(s) <= 350:
            sentences.append(s)

    cards = []
    seen_backs = set()

    def clean_question_term(t: str) -> str:
        t = t.strip().strip('"\'.,()[]')
        if not t:
            return t
        words = t.split()
        if words and words[0].lower() in ['a', 'an', 'the']:
            words[0] = words[0].lower()
            return " ".join(words)
        return t

    # 1. Rule 1: Structured Lists / Enumerations
    list_pattern = re.compile(
        r"^([^.!?]{3,60})\s+(are|include|consist of|can be divided into|comprise|have)\s+([^.!?]{10,250})$",
        re.IGNORECASE
    )
    for s in sentences:
        s_strip = s.rstrip(".!?").strip()
        match = list_pattern.search(s_strip)
        if match:
            subject = match.group(1).strip()
            verb = match.group(2).strip()
            items = match.group(3).strip()
            
            if ',' in items or ' and ' in items.lower():
                cleaned_subject = clean_question_term(subject)
                words_in_subject = cleaned_subject.split()
                if 1 <= len(words_in_subject) <= 6 and cleaned_subject.lower() not in ["it", "this", "they", "these", "there"]:
                    front = f"What are the main components, types, or categories of {cleaned_subject}?"
                    front = front[0].upper() + front[1:]
                    back = s
                    if back not in seen_backs:
                        cards.append({"front": front, "back": back})
                        seen_backs.add(back)
                    if len(cards) >= count:
                        break

    # 2. Rule 2: Strict Definitions
    def_pattern = re.compile(
        r"^([^.!?]{3,50})\s+(is defined as|are defined as|refers specifically to|refers to|means)\s+([^.!?]{10,250})$",
        re.IGNORECASE
    )
    if len(cards) < count:
        for s in sentences:
            if s in seen_backs:
                continue
            s_strip = s.rstrip(".!?").strip()
            match = def_pattern.search(s_strip)
            if match:
                term = match.group(1).strip()
                verb = match.group(2).strip()
                definition = match.group(3).strip()
                
                cleaned_term = clean_question_term(term)
                words_in_term = cleaned_term.split()
                if 1 <= len(words_in_term) <= 6 and cleaned_term.lower() not in ["it", "this", "they", "these", "there", "that", "he", "she"]:
                    front = f"Define: {cleaned_term[0].upper() + cleaned_term[1:]}"
                    back = s
                    if back not in seen_backs:
                        cards.append({"front": front, "back": back})
                        seen_backs.add(back)
                    if len(cards) >= count:
                        break

    # 3. Rule 3: Copula Definitions
    copula_pattern = re.compile(
        r"^([^.!?]{3,40})\s+(is|are|was|were)\s+([^.!?]{15,250})$",
        re.IGNORECASE
    )
    if len(cards) < count:
        for s in sentences:
            if s in seen_backs:
                continue
            s_strip = s.rstrip(".!?").strip()
            match = copula_pattern.search(s_strip)
            if match:
                term = match.group(1).strip()
                verb = match.group(2).strip()
                definition = match.group(3).strip()
                
                cleaned_term = clean_question_term(term)
                words_in_term = cleaned_term.split()
                if (1 <= len(words_in_term) <= 6 and 
                    cleaned_term.lower() not in ["it", "this", "they", "these", "there", "that", "he", "she", "who", "which"]):
                    first_def_word = definition.split()[0].lower() if definition.split() else ""
                    if first_def_word not in ["defined", "referred", "to", "because", "by", "if", "when"]:
                        if verb in ["is", "was"]:
                            front = f"What is {cleaned_term}?"
                        else:
                            front = f"What are {cleaned_term}?"
                        front = front[0].upper() + front[1:]
                        back = s
                        if back not in seen_backs:
                            cards.append({"front": front, "back": back})
                            seen_backs.add(back)
                        if len(cards) >= count:
                            break

    # 4. Rule 4: Action / Function / Purpose
    func_pattern = re.compile(
        r"^([^.!?]{3,60})\s+(functions to|plays a role in|helps to|allows us to|is used to|enables|works by|operates to)\s+([^.!?]{10,250})$",
        re.IGNORECASE
    )
    if len(cards) < count:
        for s in sentences:
            if s in seen_backs:
                continue
            s_strip = s.rstrip(".!?").strip()
            match = func_pattern.search(s_strip)
            if match:
                subject = match.group(1).strip()
                verb = match.group(2).strip()
                action = match.group(3).strip()
                
                cleaned_subject = clean_question_term(subject)
                words_in_subject = cleaned_subject.split()
                if 1 <= len(words_in_subject) <= 6 and cleaned_subject.lower() not in ["it", "this", "they", "these", "there"]:
                    front = f"What is the function or purpose of {cleaned_subject}?"
                    front = front[0].upper() + front[1:]
                    back = s
                    if back not in seen_backs:
                        cards.append({"front": front, "back": back})
                        seen_backs.add(back)
                    if len(cards) >= count:
                        break

    # 5. Rule 5: Cause, Effect & Conditions
    cause_pattern = re.compile(
        r"^([^.!?]{3,60})\s+(occurs when|happens when|results in|leads to|causes|triggers)\s+([^.!?]{10,250})$",
        re.IGNORECASE
    )
    if len(cards) < count:
        for s in sentences:
            if s in seen_backs:
                continue
            s_strip = s.rstrip(".!?").strip()
            match = cause_pattern.search(s_strip)
            if match:
                subject = match.group(1).strip()
                verb = match.group(2).strip()
                effect = match.group(3).strip()
                
                cleaned_subject = clean_question_term(subject)
                words_in_subject = cleaned_subject.split()
                if 1 <= len(words_in_subject) <= 6 and cleaned_subject.lower() not in ["it", "this", "they", "these", "there"]:
                    front = f"Under what conditions does {cleaned_subject} occur, or what does it lead to?"
                    front = front[0].upper() + front[1:]
                    back = s
                    if back not in seen_backs:
                        cards.append({"front": front, "back": back})
                        seen_backs.add(back)
                    if len(cards) >= count:
                        break

    # 6. Rule 6: General Context Facts (Fallback for other informative sentences)
    if len(cards) < count:
        for s in sentences:
            if s in seen_backs:
                continue
            
            words = s.split()
            if len(words) >= 4:
                prefix = " ".join(words[:4])
                front = f"Recall the details concerning: \"{prefix}...\""
            else:
                front = "Explain this concept:"
                
            back = s
            if back not in seen_backs:
                cards.append({"front": front, "back": back})
                seen_backs.add(back)
            if len(cards) >= count:
                break

    # 7. Rule 7: Generic Study Techniques fallback (only if input is empty or extremely short)
    if len(cards) < count:
        generic_cards = get_generic_study_cards()
        for gc in generic_cards:
            if gc["back"] not in seen_backs and len(cards) < count:
                cards.append(gc)

    return cards[:count]


class FlashcardItem(BaseModel):
    front: str
    back: str


class FlashcardSchema(BaseModel):
    flashcards: List[FlashcardItem]


def generate_flashcards(text: str, count: int = 10) -> List[dict]:
    """
    Generates high-quality flashcards from provided text using Gemini API.
    Falls back to generate_mock_flashcards if key is missing or API call fails.
    """
    if not text.strip():
        raise ValueError("No text content provided.")

    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key == "YOUR_GEMINI_API_KEY":
        logger.warning("GEMINI_API_KEY is not configured. Falling back to mock flashcards.")
        return generate_mock_flashcards(text, count)

    from google import genai
    from google.genai import types

    try:
        logger.info("Connecting to Gemini API to generate flashcards")
        client = genai.Client(api_key=api_key)

        cleaned = clean_extracted_text(text)
        excerpt = cleaned[:12000]

        prompt = f"""
You are an expert academic tutor.
Generate exactly {count} high-quality flashcards from the text below.

Each flashcard must have:
- "front": A question, term, or prompt (concise and clear)
- "back": The answer, definition, or explanation (detailed but concise)

Rules:
- Focus on key concepts, definitions, processes, relationships, and important facts.
- Front should be a specific question or term that tests recall.
- Back should provide the complete answer.
- Make them suitable for active recall and spaced repetition.
- Use clear, study-appropriate language.

Text:
---
{excerpt}
---
"""
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=FlashcardSchema,
                temperature=0.3,
            )
        )

        if response.text:
            data = json.loads(response.text)
            raw = data.get("flashcards", [])
            if raw:
                logger.info(f"Successfully generated {len(raw)} flashcards using Gemini API")
                return raw[:count]

        logger.warning("Gemini API returned an empty response. Falling back to mock flashcards.")
        return generate_mock_flashcards(text, count)

    except Exception as e:
        logger.error(f"Exception during Gemini API flashcards call: {str(e)}")
        return generate_mock_flashcards(text, count)


class LocalVocabItem(BaseModel):
    term: str
    definition: str


class LocalCondenserSchema(BaseModel):
    summary: str
    takeaways: List[str]
    vocabulary: List[LocalVocabItem]


def condense_document(text: str) -> dict:
    """
    Condenses the provided document or study notes using Gemini API.
    Falls back to a local rule-based extractor if the key is missing or API fails.
    """
    if not text.strip():
        raise ValueError("No text content provided.")

    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key == "YOUR_GEMINI_API_KEY":
        logger.warning("GEMINI_API_KEY is not configured. Falling back to local condenser.")
        return condense_document_locally(text)

    from google import genai
    from google.genai import types

    try:
        logger.info("Connecting to Gemini API to condense document")
        client = genai.Client(api_key=api_key)

        cleaned = clean_extracted_text(text)
        excerpt = cleaned[:15000]

        prompt = f"""
You are an expert academic tutor.
Condense the student's study notes or document text provided below into:
1. A high-density summary (about 2-3 paragraphs) explaining the core concept.
2. A list of key takeaways (bullet points, around 3-5 items).
3. A vocabulary list of critical terms and their definitions (around 3-5 items).

Text to condense:
---
{excerpt}
---
"""
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=LocalCondenserSchema,
                temperature=0.2,
            )
        )

        if response.text:
            data = json.loads(response.text)
            if data.get("summary") and data.get("takeaways"):
                logger.info("Successfully condensed document using Gemini API")
                return data

        logger.warning("Gemini API returned empty/invalid condenser data. Falling back to local condenser.")
        return condense_document_locally(text)

    except Exception as e:
        logger.error(f"Exception during Gemini API document condensing: {str(e)}")
        return condense_document_locally(text)


def condense_document_locally(text: str) -> dict:
    """
    Extracts summary, takeaways, and vocabulary from text locally (no AI).
    """
    logger.info("Condensing document locally")
    cleaned = clean_extracted_text(text)
    
    # 1. Fallback Summary: Combine the first 2-3 paragraphs
    paragraphs = [p.strip() for p in cleaned.split("\n") if p.strip()]
    summary_paras = []
    for p in paragraphs[:3]:
        if len(p) > 600:
            summary_paras.append(p[:600] + "...")
        else:
            summary_paras.append(p)
            
    summary = "\n\n".join(summary_paras)
    if not summary:
        summary = "No content available to summarize."

    # 2. Fallback Takeaways: Extract 4 prominent factual sentences
    raw_sentences = re.split(r"(?<=[.!?])\s+", cleaned.replace("\n", " "))
    takeaways = []
    seen_takeaways = set()
    for s in raw_sentences:
        s = re.sub(r"\s+", " ", s).strip()
        if 40 <= len(s) <= 220 and s not in seen_takeaways:
            if not re.search(r"\b(is defined as|refers to|means|include|consist of)\b", s, re.IGNORECASE):
                takeaways.append(s)
                seen_takeaways.add(s)
            if len(takeaways) >= 4:
                break
                
    if len(takeaways) < 4:
        for s in raw_sentences:
            s = re.sub(r"\s+", " ", s).strip()
            if 30 <= len(s) <= 250 and s not in seen_takeaways:
                takeaways.append(s)
                seen_takeaways.add(s)
            if len(takeaways) >= 4:
                break

    if not takeaways:
        takeaways = [
            "Actively review key notes and textbook chapters.",
            "Use practice questions and active recall to reinforce learning.",
            "Schedule reviews at increasing intervals to improve retention."
        ]

    # 3. Fallback Vocabulary: Map mock flashcards to vocabulary term-definition structure
    mock_cards = generate_mock_flashcards(text, count=5)
    vocabulary = []
    seen_terms = set()
    
    def extract_term_from_front(front: str) -> str:
        front_lower = front.lower()
        if front_lower.startswith("what is "):
            return front[8:].rstrip("?").strip()
        elif front_lower.startswith("what are "):
            return front[9:].rstrip("?").strip()
        elif front_lower.startswith("define: "):
            return front[8:].strip()
        elif "main components" in front_lower:
            idx = front_lower.find("of ")
            if idx != -1:
                return front[idx+3:].rstrip("?").strip()
        elif "conditions does" in front_lower:
            idx = front_lower.find("does ")
            idx2 = front_lower.find(" occur")
            if idx != -1 and idx2 != -1:
                return front[idx+5:idx2].strip()
        return front

    for card in mock_cards:
        term = extract_term_from_front(card["front"])
        if term:
            term = term[0].upper() + term[1:]
        definition = card["back"]
        
        if term and term not in seen_terms:
            vocabulary.append({"term": term, "definition": definition})
            seen_terms.add(term)
            
    return {
        "summary": summary,
        "takeaways": takeaways,
        "vocabulary": vocabulary
    }


class EssayGraderResponseSchema(BaseModel):
    grade: str
    thesis_score: int
    grammar_score: int
    structure_score: int
    critique: str
    recommendations: List[str]


def grade_essay(text: str, prompt: str = "") -> dict:
    """
    Grades the provided essay content against structural rubrics using Gemini API.
    Falls back to a local heuristic grader if the key is missing or API fails.
    """
    if not text.strip():
        raise ValueError("No essay text content provided.")

    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key == "YOUR_GEMINI_API_KEY":
        logger.warning("GEMINI_API_KEY is not configured. Falling back to local essay grader.")
        return grade_essay_locally(text, prompt)

    from google import genai
    from google.genai import types

    try:
        logger.info("Connecting to Gemini API to grade essay")
        client = genai.Client(api_key=api_key)

        prompt_context = f"Prompt/Question Topic: {prompt}\n\n" if prompt.strip() else ""

        full_prompt = f"""
You are an expert academic professor.
Grade and review the student's essay draft below.
{prompt_context}
Essay text:
---
{text}
---

Analyze the essay carefully and return a JSON object containing:
1. `grade`: A letter grade (e.g. A, A-, B+, B, B-, C+, C, D, F).
2. `thesis_score`: An integer score from 0 to 100 assessing the strength, clarity, and development of the central argument.
3. `grammar_score`: An integer score from 0 to 100 assessing grammar, spelling, punctuation, vocabulary, and flow.
4. `structure_score`: An integer score from 0 to 100 assessing overall essay structure, paragraph divisions, and transitions.
5. `critique`: A comprehensive paragraph (about 3-4 sentences) offering specific feedback on what they did well and where the essay falters.
6. `recommendations`: A list of exactly 3 specific, actionable recommendations/tips for how the student can improve the draft.
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=EssayGraderResponseSchema,
                temperature=0.2,
            )
        )

        if response.text:
            data = json.loads(response.text)
            if data.get("grade") and data.get("critique") and "thesis_score" in data:
                logger.info("Successfully graded essay using Gemini API")
                return data

        logger.warning("Gemini API returned empty/invalid grader data. Falling back to local essay grader.")
        return grade_essay_locally(text, prompt)

    except Exception as e:
        logger.error(f"Exception during Gemini API essay grading: {str(e)}")
        return grade_essay_locally(text, prompt)


def grade_essay_locally(text: str, prompt: str = "") -> dict:
    """
    Grades an essay locally using heuristics to estimate scorecard fields.
    """
    logger.info("Grading essay locally (heuristic mode)")
    text = text.strip()
    if not text:
        return {
            "grade": "F",
            "thesis_score": 0,
            "grammar_score": 0,
            "structure_score": 0,
            "critique": "The submitted essay is empty. Please provide content to receive feedback.",
            "recommendations": ["Ensure you paste or write essay content before grading."]
        }
    
    word_count = len(text.split())
    paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
    paragraph_count = len(paragraphs)
    
    thesis_markers = ["argues", "claims", "because", "therefore", "proposes", "contends", "shows that"]
    has_thesis_markers = sum(1 for marker in thesis_markers if marker in text.lower())
    
    transitions = ["firstly", "secondly", "however", "on the other hand", "furthermore", "moreover", "in conclusion", "consequently"]
    has_transitions = sum(1 for trans in transitions if trans in text.lower())
    
    thesis_score = 70 + min(has_thesis_markers * 4, 15) + min(word_count // 100, 10)
    thesis_score = min(max(thesis_score, 60), 98)
    
    grammar_score = 80 + min(word_count // 200, 10)
    if not text[0].isupper():
        grammar_score -= 5
    if text[-1] not in ['.', '!', '?']:
        grammar_score -= 5
    grammar_score = min(max(grammar_score, 60), 98)
    
    structure_score = 65 + min(paragraph_count * 5, 20) + min(has_transitions * 3, 10)
    structure_score = min(max(structure_score, 60), 98)
    
    avg_score = (thesis_score + grammar_score + structure_score) / 3.0
    if avg_score >= 93:
        grade = "A"
    elif avg_score >= 90:
        grade = "A-"
    elif avg_score >= 87:
        grade = "B+"
    elif avg_score >= 83:
        grade = "B"
    elif avg_score >= 80:
        grade = "B-"
    elif avg_score >= 77:
        grade = "C+"
    elif avg_score >= 70:
        grade = "C"
    else:
        grade = "D"
        
    if word_count < 150:
        critique = "The essay draft is very short, which limits the depth of analysis and argument development. Try expanding your points and explaining evidence in more detail."
        recommendations = [
            "Increase overall essay length to at least 300-500 words to sufficiently develop your points.",
            "Incorporate more details and concrete examples to support your thesis statements.",
            "Make sure you clearly outline a multi-paragraph structure (Introduction, Body, Conclusion)."
        ]
    else:
        critique = f"The draft shows a reasonable effort in addressing the prompt. The thesis has a score of {thesis_score}% based on the key logical transitions. Punctuation and sentence flow are generally sound, though refinement in structural cohesion (currently at {structure_score}%) would elevate the presentation."
        recommendations = []
        if paragraph_count < 3:
            recommendations.append("Structure the essay into distinct paragraph divisions (introduction, supporting body, and concluding thoughts).")
        if has_transitions < 3:
            recommendations.append("Use transitional phrases (e.g., 'Furthermore', 'Conversely', 'In conclusion') to smooth transitions between paragraph arguments.")
        if thesis_score < 80:
            recommendations.append("Clearly state your central thesis argument or position in the first paragraph.")
        if len(recommendations) < 3:
            recommendations.append("Incorporate more peer-reviewed evidence or primary source references to support your main assertions.")
            recommendations.append("Vary your sentence structure, combining short declarative statements with compound sentences to improve read flow.")
        recommendations = recommendations[:3]
        
    return {
        "grade": grade,
        "thesis_score": thesis_score,
        "grammar_score": grammar_score,
        "structure_score": structure_score,
        "critique": critique,
        "recommendations": recommendations
    }
