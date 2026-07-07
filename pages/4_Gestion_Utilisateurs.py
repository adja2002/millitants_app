import streamlit as st
import database
import auth
import pandas as pd
import bcrypt
import ui

st.set_page_config(page_title="Gestion Utilisateurs", page_icon="👥", layout="wide")
ui.load_css()
auth.require_admin()

st.title("Gestion des Utilisateurs")

conn = database.get_connection()
c = conn.cursor()

st.header("Créer un nouvel utilisateur (Agent de saisie)")

with st.form("form_utilisateur", clear_on_submit=True):
    new_user = st.text_input("Nom d'utilisateur *")
    new_pass = st.text_input("Mot de passe *", type="password")
    role = st.selectbox("Rôle", ["Agent de Saisie", "Administrateur"])
    
    submit = st.form_submit_button("Créer le compte")
    
    if submit:
        if not new_user or not new_pass:
            st.error("Veuillez remplir tous les champs.")
        else:
            hashed = bcrypt.hashpw(new_pass.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            try:
                c.execute("INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe, role) VALUES (%s, %s, %s)",
                          (new_user, hashed, role))
                conn.commit()
                
                admin_name = st.session_state.get('username', 'Inconnu')
                database.log_action(admin_name, "Création Compte", f"Utilisateur {new_user} avec le rôle {role}")
                
                st.success(f"L'utilisateur {new_user} a été créé avec succès !")
            except Exception as e:
                st.error("Ce nom d'utilisateur existe déjà ou une erreur est survenue.")

st.markdown("---")
st.header("Liste des utilisateurs existants")

df_users = pd.read_sql_query("SELECT id, nom_utilisateur, role FROM utilisateurs", conn)
st.dataframe(df_users, use_container_width=True)

conn.close()
