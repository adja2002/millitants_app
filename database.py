import psycopg2
import psycopg2.extras
import bcrypt
import streamlit as st
import os

def get_connection():
    try:
        db_url = st.secrets["DATABASE_URL"]
    except Exception:
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            st.error("DATABASE_URL n'est pas configuré. Créez un dossier `.streamlit` contenant un fichier `secrets.toml` avec votre clé.")
            st.stop()

    conn = psycopg2.connect(db_url)
    # Permet d'accéder aux colonnes par leur nom comme avec sqlite3.Row
    conn.cursor_factory = psycopg2.extras.DictCursor
    return conn

def log_action(utilisateur, action, description):
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO historique_activites (utilisateur, action, description)
        VALUES (%s, %s, %s)
    ''', (utilisateur, action, description))
    conn.commit()
    conn.close()

def init_db():
    conn = get_connection()
    c = conn.cursor()
    
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

    # Insert default admin user if not exists
    c.execute('SELECT * FROM utilisateurs WHERE nom_utilisateur = %s', ('admin',))
    if not c.fetchone():
        hashed = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
        c.execute('INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe, role) VALUES (%s, %s, %s)',
                  ('admin', hashed.decode('utf-8'), 'Administrateur'))

    conn.commit()
    conn.close()

if __name__ == '__main__':
    # Ceci échouera si exécuté directement sans st.secrets, sauf si DATABASE_URL est en variable d'env
    init_db()
    print("Database initialized successfully.")
