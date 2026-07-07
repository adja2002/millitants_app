import streamlit as st
import database
import auth
import os
import ui

st.set_page_config(page_title="Système Militants", page_icon="🗳️", layout="wide")
ui.load_css()

try:
    database.init_db()
except Exception as e:
    st.warning("Assurez-vous que DATABASE_URL est configuré (secrets.toml).")


st.title("Système de Gestion des Militants")

if 'logged_in' not in st.session_state:
    st.session_state['logged_in'] = False

if not st.session_state['logged_in']:
    st.write("Veuillez vous connecter pour accéder à la plateforme.")
    
    col1, col2 = st.columns([1, 2])
    
    with col1:
        if os.path.exists("images/photo_candidat.jpeg"):
            st.image("images/photo_candidat.jpeg", use_container_width=True, caption="Notre Candidat, Notre Avenir")
            
    with col2:
        with st.form("login_form"):
            username = st.text_input("Nom d'utilisateur")
            password = st.text_input("Mot de passe", type="password")
            submit = st.form_submit_button("Se connecter")
        if submit:
            if auth.login(username, password):
                st.success("Connexion réussie !")
                st.rerun()
            else:
                st.error("Identifiants incorrects.")
else:
    st.write(f"Connecté en tant que: **{st.session_state['username']}** ({st.session_state['role']})")
    if st.button("Se déconnecter"):
        auth.logout()
        st.rerun()
    
    st.info("👈 Veuillez utiliser la barre latérale (Menu) pour naviguer entre les pages.")
    
    if st.session_state['role'] == 'Administrateur':
        st.success("Vous êtes Administrateur. Vous avez accès à toutes les fonctionnalités (Tableau de bord, ajout, modifications).")
    else:
        st.success("Vous êtes Agent de Saisie. Vous pouvez ajouter de nouveaux militants via le menu Saisie.")
