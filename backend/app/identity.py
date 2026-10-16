import hashlib
import secrets
import sqlite3
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from .storage.database import get_db

router=APIRouter(prefix='/api/students',tags=['anonymous-students'])

class AnonymousIdentity(BaseModel):
    model_config=ConfigDict(extra='forbid')
    student_id: str=Field(pattern=r'^[0-9a-f]{32}$')
    token: str=Field(pattern=r'^[0-9a-f]{64}$')

def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()

def current_student(authorization: str | None=Header(default=None),db: sqlite3.Connection=Depends(get_db)):
    if not authorization or not authorization.startswith('Bearer ') or len(authorization)!=71:
        raise HTTPException(401,'无法验证本机匿名记录，请保留浏览器中的学习凭据。')
    student=db.execute('SELECT student_id FROM students WHERE token_hash=?',(token_hash(authorization[7:]),)).fetchone()
    if not student:
        raise HTTPException(401,'匿名学习凭据无效，请检查是否清除了浏览器数据。')
    return student['student_id']

@router.post('')
def create_student(body: AnonymousIdentity,db: sqlite3.Connection=Depends(get_db)):
    # Idempotent registration: client saves random credentials before requesting.
    with db:
        db.execute('BEGIN IMMEDIATE')
        old=db.execute('SELECT token_hash FROM students WHERE student_id=?',(body.student_id,)).fetchone()
        digest=token_hash(body.token)
        if old and not secrets.compare_digest(old['token_hash'],digest):
            raise HTTPException(409,'匿名编号与本机凭据不匹配；不会覆盖已有学习记录。')
        if not old:
            try:
                db.execute('INSERT INTO students(student_id,token_hash) VALUES(?,?)',(body.student_id,digest))
            except sqlite3.IntegrityError:
                raise HTTPException(409,'匿名凭据冲突，未覆盖任何记录。')
    return {'student_id':body.student_id}

@router.get('/me')
def me(student: str=Depends(current_student)):
    return {'student_id':student}
