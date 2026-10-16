"""SQLite storage for anonymous classroom records. Each request owns a connection."""
import json
import os
import sqlite3
from contextlib import closing
from pathlib import Path
from ..question_bank import QUESTIONS, BANK_VERSION

def database_path():
    return Path(os.environ.get('KNOWLEDGE_MAP_DB', Path(__file__).resolve().parents[2]/'data'/'learning.sqlite3'))

def connect():
    # FastAPI may execute sync dependencies and handlers on different workers.
    # Each request still owns its connection; writers serialize in transactions.
    connection=sqlite3.connect(database_path(), timeout=15, check_same_thread=False)
    connection.row_factory=sqlite3.Row
    connection.execute('PRAGMA foreign_keys=ON')
    connection.execute('PRAGMA busy_timeout=15000')
    return connection

def get_db():
    connection=connect()
    try:
        yield connection
    finally:
        connection.close()

def initialize_database():
    database_path().parent.mkdir(parents=True,exist_ok=True)
    with closing(connect()) as db, db:
        db.execute('PRAGMA journal_mode=WAL')
        version=db.execute('PRAGMA user_version').fetchone()[0]
        if version not in (0,1,2):
            raise RuntimeError('Unsupported database version; restore the matching application.')
        db.executescript('''
        CREATE TABLE IF NOT EXISTS students (
          student_id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        );
        CREATE TABLE IF NOT EXISTS questions (
          id TEXT PRIMARY KEY, module TEXT NOT NULL CHECK(module IN ('toa','tdoa','rss','aoa')),
          bank_version TEXT NOT NULL, payload TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS test_attempts (
          id TEXT PRIMARY KEY, student_id TEXT NOT NULL REFERENCES students(student_id),
          status TEXT NOT NULL CHECK(status IN ('in_progress','submitted')),
          started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
          submitted_at TEXT
        );
        CREATE UNIQUE INDEX IF NOT EXISTS one_active_attempt ON test_attempts(student_id) WHERE status='in_progress';
        CREATE INDEX IF NOT EXISTS student_attempts ON test_attempts(student_id,started_at);
        CREATE TABLE IF NOT EXISTS test_attempt_questions (
          attempt_id TEXT NOT NULL REFERENCES test_attempts(id), question_id TEXT NOT NULL,
          ordinal INTEGER NOT NULL, snapshot TEXT NOT NULL,
          PRIMARY KEY(attempt_id,question_id), UNIQUE(attempt_id,ordinal)
        );
        CREATE TABLE IF NOT EXISTS test_answers (
          attempt_id TEXT NOT NULL, question_id TEXT NOT NULL, module TEXT NOT NULL,
          selected_option TEXT NOT NULL CHECK(selected_option IN ('A','B','C','D')),
          is_correct INTEGER NOT NULL CHECK(is_correct IN (0,1)),
          PRIMARY KEY(attempt_id,question_id),
          FOREIGN KEY(attempt_id,question_id) REFERENCES test_attempt_questions(attempt_id,question_id)
        );
        CREATE TABLE IF NOT EXISTS practice_answers (
          id INTEGER PRIMARY KEY, student_id TEXT NOT NULL REFERENCES students(student_id),
          request_id TEXT NOT NULL, question_id TEXT NOT NULL, snapshot TEXT NOT NULL,
          selected_option TEXT NOT NULL CHECK(selected_option IN ('A','B','C','D')),
          is_correct INTEGER NOT NULL CHECK(is_correct IN (0,1)),
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
          UNIQUE(student_id,request_id)
        );
        ''')
        if 'result_json' not in {row['name'] for row in db.execute('PRAGMA table_info(test_attempts)')}:
            db.execute('ALTER TABLE test_attempts ADD COLUMN result_json TEXT')
        db.execute('PRAGMA user_version=2')
        for q in QUESTIONS:
            db.execute('''INSERT INTO questions VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET
                          module=excluded.module,bank_version=excluded.bank_version,payload=excluded.payload''',
                       (q['id'],q['module'],BANK_VERSION,json.dumps(q,ensure_ascii=False)))

