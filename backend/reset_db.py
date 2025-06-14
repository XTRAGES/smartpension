import os
import sys
import sqlite3
import datetime
from werkzeug.security import generate_password_hash

# Delete existing database file
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pension.db')
if os.path.exists(db_path):
    print(f"Removing existing database: {db_path}")
    os.remove(db_path)

# Create new database
print("Creating new database...")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create User table
cursor.execute('''
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(256),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    address VARCHAR(200),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    wallet_address VARCHAR(42) UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'pensioner',
    pensioner_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

# Create Verification table
cursor.execute('''
CREATE TABLE IF NOT EXISTS verification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pensioner_id INTEGER NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    verification_image VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user (id)
)
''')

# Add demo users
print("Adding demo users...")

# Demo Pensioner
cursor.execute('''
INSERT INTO user (email, password_hash, first_name, last_name, role, phone, wallet_address)
VALUES (?, ?, ?, ?, ?, ?, ?)
''', (
    'pensioner@smartpension.com',
    generate_password_hash('password123'),
    'John',
    'Doe',
    'pensioner',
    '123-456-7890',
    '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc'
))

# Demo Admin
cursor.execute('''
INSERT INTO user (email, password_hash, first_name, last_name, role, wallet_address)
VALUES (?, ?, ?, ?, ?, ?)
''', (
    'admin@smartpension.com',
    generate_password_hash('admin123'),
    'Admin',
    'User',
    'admin',
    '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
))

# Demo Doctor
cursor.execute('''
INSERT INTO user (email, password_hash, first_name, last_name, role, wallet_address)
VALUES (?, ?, ?, ?, ?, ?)
''', (
    'doctor@smartpension.com',
    generate_password_hash('doctor123'),
    'Dr',
    'Smith',
    'doctor',
    '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
))

# Commit changes and close
conn.commit()
conn.close()

print("Database reset and demo users created successfully!") 