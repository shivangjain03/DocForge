# backend/session_logger.py

import sqlite3
import os
from datetime import datetime

# Ensure the database file is in the uploads/ directory
DB_PATH = "uploads/session_logs.db"

def init_db():
    os.makedirs("uploads", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            repo TEXT,
            status TEXT,
            output_path TEXT,
            error TEXT
        )
    ''')
    conn.commit()
    conn.close()

def log_session(request_id, repo, status, output_path=None, error=None):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        INSERT INTO logs (id, timestamp, repo, status, output_path, error)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        request_id,
        datetime.utcnow().isoformat(),
        repo,
        status,
        output_path,
        error
    ))
    conn.commit()
    conn.close()
