import streamlit as st
import bcrypt
import database

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def login(username, password):
    conn = database.get_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM utilisateurs WHERE nom_utilisateur = %s', (username,))
    user = c.fetchone()
    conn.close()
    
    if user and check_password(password, user['mot_de_passe']):
        st.session_state['logged_in'] = True
        st.session_state['username'] = user['nom_utilisateur']
        st.session_state['role'] = user['role']
        return True
    return False

def logout():
    st.session_state['logged_in'] = False
    st.session_state['username'] = None
    st.session_state['role'] = None

def require_login():
    if 'logged_in' not in st.session_state or not st.session_state['logged_in']:
        st.warning("Veuillez vous connecter pour accéder à cette page.")
        st.stop()

def require_admin():
    require_login()
    if st.session_state.get('role') != 'Administrateur':
        st.error("Accès refusé. Cette page est réservée aux administrateurs.")
        st.stop()
