import secrets
import sqlite3
from fastapi.testclient import TestClient
from app.main import app
from app.storage.database import initialize_database

def test_anonymous_identity_is_persistent_and_cannot_be_rebound(tmp_path, monkeypatch):
    path=tmp_path/'learning.sqlite3';monkeypatch.setenv('KNOWLEDGE_MAP_DB',str(path))
    initialize_database()
    identity={'student_id':secrets.token_hex(16),'token':secrets.token_hex(32)}
    with TestClient(app) as client:
        assert client.post('/api/students',json=identity).status_code==200
        assert client.post('/api/students',json=identity).json()['student_id']==identity['student_id']
        assert client.post('/api/students',json={**identity,'token':secrets.token_hex(32)}).status_code==409
        assert client.get('/api/students/me').status_code==401
        assert client.get('/api/students/me',headers={'Authorization':f"Bearer {identity['token']}"}).json()['student_id']==identity['student_id']
    initialize_database()
    with TestClient(app) as client:
        assert client.get('/api/students/me',headers={'Authorization':f"Bearer {identity['token']}"}).status_code==200
    with sqlite3.connect(path) as connection:
        assert connection.execute('select count(*) from students').fetchone()[0]==1
        assert connection.execute('select token_hash from students').fetchone()[0]!=identity['token']
        assert connection.execute('PRAGMA journal_mode').fetchone()[0]=='wal'
