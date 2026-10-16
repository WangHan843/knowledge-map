"""Anonymous classroom practice and atomic, idempotent formal assessments."""
import json
import secrets
import sqlite3
from typing import Literal
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from .identity import current_student
from .storage.database import get_db
from .question_bank import MODULES, public_question, answer_feedback
from .assessment import module_levels

router=APIRouter(prefix='/api',tags=['classroom'])
Option=Literal['A','B','C','D']
Module=Literal['toa','tdoa','rss','aoa']

class PracticeAnswer(BaseModel):
    model_config=ConfigDict(extra='forbid')
    question_id: str=Field(max_length=80)
    selected_option: Option
    request_id: str=Field(pattern=r'^[0-9a-f]{32}$')

class Submission(BaseModel):
    model_config=ConfigDict(extra='forbid')
    answers: dict[str,Option]=Field(max_length=6)

def owned_attempt(db, attempt_id, student):
    row=db.execute('SELECT * FROM test_attempts WHERE id=? AND student_id=?',(attempt_id,student)).fetchone()
    if row is None:
        raise HTTPException(404,'找不到属于本机匿名学生的测试记录。')
    return row

def snapshots(db, attempt_id):
    return [json.loads(row['snapshot']) for row in db.execute(
        'SELECT snapshot FROM test_attempt_questions WHERE attempt_id=? ORDER BY ordinal',(attempt_id,))]

def attempt_view(db, row):
    return {'id':row['id'],'is_demo':False,
            'questions':[public_question(q) for q in snapshots(db,row['id'])],
            'result':json.loads(row['result_json']) if row['result_json'] else None}

@router.get('/questions')
def questions(node_id: Module | None=None,student: str=Depends(current_student),db: sqlite3.Connection=Depends(get_db)):
    rows=db.execute('SELECT payload FROM questions WHERE (? IS NULL OR module=?) ORDER BY id',(node_id,node_id))
    return [public_question(json.loads(row['payload'])) for row in rows]

@router.post('/practice/check')
def practice(body: PracticeAnswer,student: str=Depends(current_student),db: sqlite3.Connection=Depends(get_db)):
    with db:
        db.execute('BEGIN IMMEDIATE')
        old=db.execute('SELECT * FROM practice_answers WHERE student_id=? AND request_id=?',(student,body.request_id)).fetchone()
        if old:
            if old['question_id']!=body.question_id or old['selected_option']!=body.selected_option:
                raise HTTPException(409,'这次练习已保存；请开始新的练习后再作答。')
            return answer_feedback(json.loads(old['snapshot']),old['selected_option'])
        row=db.execute('SELECT payload FROM questions WHERE id=?',(body.question_id,)).fetchone()
        if not row:
            raise HTTPException(404,'题目不存在。')
        q=json.loads(row['payload'])
        feedback=answer_feedback(q,body.selected_option)
        db.execute('''INSERT INTO practice_answers(student_id,request_id,question_id,snapshot,selected_option,is_correct)
                      VALUES(?,?,?,?,?,?)''',(student,body.request_id,q['id'],row['payload'],body.selected_option,int(feedback['is_correct'])))
    return feedback

@router.get('/levels')
def levels(student: str=Depends(current_student),db: sqlite3.Connection=Depends(get_db)):
    return module_levels(db,student)

@router.post('/attempts')
def start(student: str=Depends(current_student),db: sqlite3.Connection=Depends(get_db)):
    with db:
        db.execute('BEGIN IMMEDIATE')
        active=db.execute("SELECT * FROM test_attempts WHERE student_id=? AND status='in_progress'",(student,)).fetchone()
        if active:
            return attempt_view(db,active)
        bank=[json.loads(row['payload']) for row in db.execute('SELECT payload FROM questions ORDER BY id')]
        rng=secrets.SystemRandom()
        chosen=[rng.choice([q for q in bank if q['module']==module]) for module in MODULES]
        chosen+=rng.sample([q for q in bank if q not in chosen],2)
        rng.shuffle(chosen)
        attempt_id=uuid4().hex
        db.execute("INSERT INTO test_attempts(id,student_id,status) VALUES(?,?,'in_progress')",(attempt_id,student))
        db.executemany('INSERT INTO test_attempt_questions VALUES(?,?,?,?)',[
            (attempt_id,q['id'],i,json.dumps(q,ensure_ascii=False)) for i,q in enumerate(chosen)])
        return attempt_view(db,owned_attempt(db,attempt_id,student))

@router.get('/attempts/current')
def current(student: str=Depends(current_student),db: sqlite3.Connection=Depends(get_db)):
    row=db.execute('SELECT * FROM test_attempts WHERE student_id=? ORDER BY rowid DESC LIMIT 1',(student,)).fetchone()
    return attempt_view(db,row) if row else None

@router.get('/attempts/{attempt_id}')
def resume(attempt_id: str,student: str=Depends(current_student),db: sqlite3.Connection=Depends(get_db)):
    return attempt_view(db,owned_attempt(db,attempt_id,student))

@router.post('/attempts/{attempt_id}/submit')
def submit(attempt_id: str,body: Submission,student: str=Depends(current_student),db: sqlite3.Connection=Depends(get_db)):
    with db:
        # Serialize start/submit per SQLite writer. A retry never overwrites answers.
        db.execute('BEGIN IMMEDIATE')
        row=owned_attempt(db,attempt_id,student)
        if row['status']=='submitted':
            return json.loads(row['result_json'])
        issued=snapshots(db,attempt_id)
        if set(body.answers)!={q['id'] for q in issued}:
            raise HTTPException(422,'请完成本次测试的全部6题；不能提交其他题目。')
        feedback=[answer_feedback(q,body.answers[q['id']]) for q in issued]
        db.executemany('INSERT INTO test_answers VALUES(?,?,?,?,?)',[
            (attempt_id,a['question_id'],a['node_id'],a['selected_option'],int(a['is_correct'])) for a in feedback])
        db.execute("UPDATE test_attempts SET status='submitted',submitted_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?",(attempt_id,))
        result={'attempt_id':attempt_id,'is_demo':False,'correct_count':sum(a['is_correct'] for a in feedback),
                'total':len(issued),'answers':feedback,'nodes':module_levels(db,student)}
        db.execute('UPDATE test_attempts SET result_json=? WHERE id=?',(json.dumps(result,ensure_ascii=False),attempt_id))
        return result
