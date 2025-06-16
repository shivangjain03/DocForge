# backend/db_utils.py
import sqlite3
from datetime import datetime
import os
DB_NAME = "session.db"


def init_db():
        conn = sqlite3.connect("session.db")
        cursor = conn.cursor()
        
        # Tenants (companies/teams)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tenants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
        ''')

        # Users with roles
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'viewer')),
                tenant_id INTEGER,
                FOREIGN KEY (tenant_id) REFERENCES tenants(id)
            )
        ''')

        # Logs (now tenant-aware)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id TEXT,
                source TEXT,
                status TEXT,
                timestamp TEXT,
                error TEXT,
                user_id INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')

        conn.commit()
        conn.close()

def log_session(request_id, source, status, timestamp, error=None, user_id=None):
    conn = sqlite3.connect("session.db")
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO sessions (request_id, source, status, timestamp, error, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (request_id, source, status, timestamp, error, user_id))
    conn.commit()
    conn.close()

def create_version_table():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS project_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            repo_name TEXT,
            version INTEGER,
            timestamp TEXT
        )
    """)
    conn.commit()
    conn.close()


def get_latest_version(repo_name: str) -> int:
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(version) FROM project_versions WHERE repo_name=?", (repo_name,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row[0] else 0

def insert_project_version(repo_name: str, version: int):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO project_versions (repo_name, version, timestamp)
        VALUES (?, ?, ?)
    """, (repo_name, version, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()
    
    
def get_doc_by_version(repo_name: str, version: int):
    conn = sqlite3.connect("session.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT output FROM doc_generations
        WHERE repo_name = ? AND version = ?
    """, (repo_name, version))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None


def create_generation_table():
    conn = sqlite3.connect("session.db")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS doc_generations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id TEXT,
            repo_name TEXT,
            version INTEGER,
            persona TEXT,
            prompt TEXT,
            output TEXT,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()


def insert_doc_generation(request_id, repo_name, version, persona, prompt, output, timestamp):
    conn = sqlite3.connect("session.db")
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO doc_generations (request_id, repo_name, version, persona, prompt, output, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (request_id, repo_name, version, persona, prompt, output, timestamp))
    conn.commit()
    conn.close()
