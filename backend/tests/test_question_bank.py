from collections import Counter
from app.question_bank import QUESTIONS, public_question, validate_bank
import copy
import pytest

@pytest.mark.parametrize('answer',['','AB','E'])
def test_invalid_answer_keys_are_rejected(answer):
    bank=copy.deepcopy(QUESTIONS);bank[0]['answer']=answer
    with pytest.raises(ValueError):validate_bank(bank)

def test_reviewed_bank_has_twenty_unique_sourced_questions():
    assert len(QUESTIONS) == 20
    assert len({q['id'] for q in QUESTIONS}) == 20
    assert Counter(q['module'] for q in QUESTIONS) == dict.fromkeys(['toa','tdoa','rss','aoa'],5)
    for q in QUESTIONS:
        assert [o['id'] for o in q['options']] == list('ABCD')
        assert q['answer'] in 'ABCD'
        assert len({o['text'] for o in q['options']}) == 4
        assert q['explanation'] and 'PDF第' in q['source']

def test_public_bank_does_not_expose_keys_or_explanations():
    for q in QUESTIONS:
        public = public_question(q)
        assert set(public) == {'id','node_id','stem','options','source','is_demo'}
        assert public['is_demo'] is False
