import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    if not DATABASE_URL:
        raise Exception("DATABASE_URL is not set")
    conn = psycopg2.connect(DATABASE_URL)
    conn.cursor_factory = psycopg2.extras.RealDictCursor
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # We assume tables are already created from the Streamlit version, 
    # but we can keep the create table statements just in case.
    c.execute('''
        CREATE TABLE IF NOT EXISTS utilisateurs (
            id SERIAL PRIMARY KEY,
            nom_utilisateur TEXT UNIQUE NOT NULL,
            mot_de_passe TEXT NOT NULL,
            role TEXT NOT NULL
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS sections (
            code_section TEXT PRIMARY KEY,
            nom_section TEXT NOT NULL,
            responsable TEXT
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS cellules (
            code_cellule TEXT PRIMARY KEY,
            nom_cellule TEXT NOT NULL,
            quartier TEXT,
            responsable TEXT,
            telephone TEXT,
            code_section TEXT,
            FOREIGN KEY (code_section) REFERENCES sections(code_section)
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS militants (
            id SERIAL PRIMARY KEY,
            code_militant TEXT UNIQUE NOT NULL,
            nom TEXT NOT NULL,
            prenoms TEXT,
            sexe TEXT,
            date_naissance TEXT,
            lieu_naissance TEXT,
            num_cni TEXT,
            num_carte_electeur TEXT,
            lieu_vote TEXT,
            bureau_vote TEXT,
            telephone_1 TEXT,
            quartier TEXT,
            code_cellule TEXT,
            code_section TEXT,
            profession TEXT,
            date_adhesion TEXT,
            responsable_recensement TEXT,
            observations TEXT,
            FOREIGN KEY (code_cellule) REFERENCES cellules(code_cellule),
            FOREIGN KEY (code_section) REFERENCES sections(code_section)
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS historique_activites (
            id SERIAL PRIMARY KEY,
            utilisateur TEXT NOT NULL,
            action TEXT NOT NULL,
            description TEXT,
            date_heure TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def log_action(utilisateur: str, action: str, description: str):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO historique_activites (utilisateur, action, description)
        VALUES (%s, %s, %s)
    ''', (utilisateur, action, description))
    conn.commit()
    conn.close()
