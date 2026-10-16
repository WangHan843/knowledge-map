"""Fixed, textbook-checked bank. Never serialize the complete record before scoring."""
import json
from pathlib import Path
from collections import Counter

BANK_VERSION = '2026-10-12-v1'
MODULES = ('toa', 'tdoa', 'rss', 'aoa')
QUESTIONS = json.loads(Path(__file__).with_name('questions.json').read_text(encoding='utf-8'))

def validate_bank(questions):
    if len(questions) != 20 or len({q['id'] for q in questions}) != 20:
        raise ValueError('The formal bank must contain 20 unique questions.')
    if Counter(q['module'] for q in questions) != dict.fromkeys(MODULES, 5):
        raise ValueError('Each module requires five questions.')
    for q in questions:
        if [o['id'] for o in q['options']] != list('ABCD') or q['answer'] not in {'A','B','C','D'}:
            raise ValueError('Invalid options or answer.')
        if not q['source'] or not q['explanation']:
            raise ValueError('Textbook source and explanation are required.')

validate_bank(QUESTIONS)

def public_question(q):
    return dict(id=q['id'], node_id=q['module'], stem=q['question'],
                options=q['options'], source=q['source'], is_demo=False)

def answer_feedback(q, selected):
    return dict(question_id=q['id'], node_id=q['module'], selected_option=selected,
                correct_option=q['answer'], is_correct=selected == q['answer'],
                explanation=q['explanation'], source=q['source'], is_demo=False)
