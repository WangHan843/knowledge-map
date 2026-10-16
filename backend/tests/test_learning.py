import json
from concurrent.futures import ThreadPoolExecutor
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.question_bank import QUESTIONS
from app.storage.database import connect

@pytest.fixture
def classroom(tmp_path, monkeypatch):
    monkeypatch.setenv('KNOWLEDGE_MAP_DB', str(tmp_path/'class.sqlite3'))
    with TestClient(app) as client:
        credentials={'student_id':'a'*32,'token':'b'*64}
        assert client.post('/api/students',json=credentials).status_code==200
        client.headers['Authorization']='Bearer '+credentials['token']
        yield client

def answers_for(attempt, correct=True):
    bank={q['id']:q for q in QUESTIONS}
    return {q['id']:bank[q['id']]['answer'] if correct else next(o for o in 'ABCD' if o!=bank[q['id']]['answer']) for q in attempt['questions']}

def test_practice_is_separate_and_idempotent(classroom):
    c=classroom
    assert len(c.get('/api/questions').json())==20
    assert len(c.get('/api/questions?node_id=toa').json())==5
    body={'question_id':QUESTIONS[0]['id'],'selected_option':QUESTIONS[0]['answer'],'request_id':'c'*32}
    first=c.post('/api/practice/check',json=body)
    assert first.status_code==200 and first.json()['is_correct']
    assert c.post('/api/practice/check',json=body).json()==first.json()
    assert all(n['level']=='unassessed' for n in c.get('/api/levels').json())
    with connect() as db:
        assert db.execute('SELECT count(*) FROM practice_answers').fetchone()[0]==1
        assert db.execute('SELECT count(*) FROM test_answers').fetchone()[0]==0

def test_formal_atomic_snapshot_and_cumulative(classroom):
    c=classroom
    attempt=c.post('/api/attempts').json()
    assert len(attempt['questions'])==6
    assert len({q['id'] for q in attempt['questions']})==6
    assert {q['node_id'] for q in attempt['questions']}=={'toa','tdoa','rss','aoa'}
    assert all('answer' not in q and 'explanation' not in q for q in attempt['questions'])
    assert c.post('/api/attempts').json()==attempt
    assert c.get('/api/attempts/current').json()==attempt
    endpoint=f"/api/attempts/{attempt['id']}/submit"
    assert c.post(endpoint,json={'answers':{}}).status_code==422
    good=answers_for(attempt)
    # Editing the live bank cannot change a test already issued.
    with connect() as db:
        q=attempt['questions'][0]
        payload=json.loads(db.execute('SELECT payload FROM questions WHERE id=?',(q['id'],)).fetchone()[0])
        payload['answer']=next(o for o in 'ABCD' if o!=payload['answer'])
        db.execute('UPDATE questions SET payload=? WHERE id=?',(json.dumps(payload),q['id']))
    result=c.post(endpoint,json={'answers':good}).json()
    assert result['correct_count']==6
    assert all(n['level']=='mastered' for n in result['nodes'])
    assert c.post(endpoint,json={'answers':answers_for(attempt,False)}).json()==result
    second=c.post('/api/attempts').json()
    with connect() as db:
        issued=[json.loads(r[0]) for r in db.execute('SELECT snapshot FROM test_attempt_questions WHERE attempt_id=?',(second['id'],))]
    wrong={q['id']: next(o for o in 'ABCD' if o!=q['answer']) for q in issued}
    assert c.post(f"/api/attempts/{second['id']}/submit",json={'answers':wrong}).status_code==200
    assert c.post(endpoint,json={'answers':good}).json()==result
    with connect() as db:
        rows=db.execute('SELECT module,sum(is_correct),count(*) FROM test_answers GROUP BY module').fetchall()
        assert sum(r[2] for r in rows)==12
        from app.assessment import level_for
        expected={r[0]:level_for(r[1],r[2]) for r in rows}
    assert {n['node_id']:n['level'] for n in c.get('/api/levels').json()}==expected
    assert all(set(n)=={'node_id','level'} for n in c.get('/api/levels').json())

def test_ownership_and_concurrent_submission(classroom):
    c=classroom
    attempt=c.post('/api/attempts').json()
    other={'student_id':'c'*32,'token':'d'*64}
    c.post('/api/students',json=other)
    foreign={'Authorization':'Bearer '+other['token']}
    assert c.get(f"/api/attempts/{attempt['id']}",headers=foreign).status_code==404
    endpoint=f"/api/attempts/{attempt['id']}/submit"
    assert c.post(endpoint,headers=foreign,json={'answers':answers_for(attempt)}).status_code==404
    with ThreadPoolExecutor(max_workers=4) as pool:
        results=list(pool.map(lambda _: c.post(endpoint,json={'answers':answers_for(attempt)}),range(4)))
    assert all(r.status_code==200 for r in results)
    assert all(r.json()==results[0].json() for r in results)
    with connect() as db:
        assert db.execute('SELECT count(*) FROM test_answers').fetchone()[0]==6
    # A new app lifespan reloads the same persisted results.
    with TestClient(app) as restarted:
        response=restarted.get('/api/attempts/current',headers=dict(c.headers))
        assert response.json()['result']==results[0].json()

@pytest.mark.parametrize('correct,total,expected',[(0,0,'unassessed'),(0,5,'unskilled'),(39,100,'unskilled'),(2,5,'understood'),(59,100,'understood'),(3,5,'familiar'),(79,100,'familiar'),(4,5,'mastered'),(5,5,'mastered')])
def test_level_boundaries(correct,total,expected):
    from app.assessment import level_for
    assert level_for(correct,total)==expected
