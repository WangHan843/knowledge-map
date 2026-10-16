from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def start():
    response = client.post('/api/demo/attempts')
    assert response.status_code == 200
    data = response.json()
    return data, {'Authorization': f"Bearer {data['token']}"}


def test_demo_start_has_four_nodes_without_answer_keys():
    data, _ = start()
    assert data['is_demo'] is True
    assert {q['node_id'] for q in data['questions']} == {'toa', 'tdoa', 'rss', 'aoa'}
    assert len({q['id'] for q in data['questions']}) == 4
    assert all('correct_option' not in q and 'explanation' not in q for q in data['questions'])


def test_incomplete_and_invalid_answers_cannot_submit():
    data, headers = start()
    url = f"/api/demo/attempts/{data['id']}/submit"
    assert client.post(url, headers=headers, json={'answers': {}}).status_code == 422
    answers = {q['id']: 'Z' for q in data['questions']}
    assert client.post(url, headers=headers, json={'answers': answers}).status_code == 422
    assert client.get(f"/api/demo/attempts/{data['id']}", headers=headers).json()['result'] is None


def test_submissions_are_idempotent_and_preserve_original_answers():
    data, headers = start()
    url = f"/api/demo/attempts/{data['id']}/submit"
    answers = {q['id']: 'A' for q in data['questions']}
    first = client.post(url, headers=headers, json={'answers': answers})
    assert first.status_code == 200
    second = client.post(url, headers=headers, json={'answers': {q['id']: 'B' for q in data['questions']}})
    assert second.json() == first.json()
    assert all(a['selected_option'] == 'A' for a in first.json()['answers'])
    assert all(a['level'] == 'unassessed' for a in first.json()['nodes'])


def test_attempt_access_requires_its_random_token():
    data, _ = start()
    other, other_headers = start()
    url = f"/api/demo/attempts/{data['id']}"
    assert data['token'] != other['token']
    assert client.get(url).status_code == 404
    assert client.get(url, headers=other_headers).status_code == 404


def test_practice_feedback_is_server_scored_and_demo_only():
    response = client.get('/api/demo/questions?node_id=toa')
    assert response.status_code == 200
    questions = response.json()
    assert len(questions) == 1
    assert 'correct_option' not in questions[0]
    result = client.post('/api/demo/practice/check', json={'question_id': questions[0]['id'], 'selected_option': 'B'})
    assert result.status_code == 200
    assert result.json()['is_correct'] is True
    assert result.json()['is_demo'] is True
    assert result.json()['explanation']


def test_unknown_api_is_not_spa_and_sources_are_not_served():
    assert client.get('/api/not-real').status_code == 404
    assert client.get('/source-materials/private.pdf').status_code == 404
    assert client.get('/api/demo/questions?node_id=invalid').status_code == 422
