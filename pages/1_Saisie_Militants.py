import streamlit as st
import database
import auth
import pandas as pd

st.set_page_config(page_title="Saisie Militants", page_icon="📝", layout="wide")
auth.require_login()

st.title("Ajouter un nouveau militant")

conn = database.get_connection()
c = conn.cursor()

# Récupérer les sections pour le menu déroulant
c.execute("SELECT code_section, nom_section FROM sections")
sections = c.fetchall()
section_options = {row['code_section']: f"{row['code_section']} - {row['nom_section']}" for row in sections}

# Récupérer les cellules pour le menu déroulant
c.execute("SELECT code_cellule, nom_cellule, code_section FROM cellules")
cellules = c.fetchall()

with st.form("form_militant", clear_on_submit=True):
    col1, col2, col3 = st.columns(3)
    
    with col1:
        code_militant = st.text_input("Code Militant *", help="Identifiant unique du militant")
        nom = st.text_input("Nom *")
        prenoms = st.text_input("Prénom(s)")
        sexe = st.selectbox("Sexe", ["Homme", "Femme"])
        date_naissance = st.date_input("Date de naissance")
        lieu_naissance = st.text_input("Lieu de naissance")
        
    with col2:
        num_cni = st.text_input("N° CNI")
        num_carte_electeur = st.text_input("N° Carte d'électeur")
        lieu_vote = st.text_input("Lieu de vote")
        bureau_vote = st.text_input("Bureau de vote")
        telephone_1 = st.text_input("Téléphone")
        quartier = st.text_input("Quartier")

    with col3:
        # Filtrer dynamiquement les cellules en fonction de la section n'est pas nativement 
        # facile dans un seul form Streamlit sans rerun, donc on liste tout ou on fait un format simple
        section_id = st.selectbox("Section *", options=list(section_options.keys()), format_func=lambda x: section_options[x] if x in section_options else x)
        
        # On pourrait utiliser javascript ou une sélection en deux temps, mais pour simplifier dans le form :
        cellule_options = {row['code_cellule']: f"{row['code_cellule']} - {row['nom_cellule']} (Sec: {row['code_section']})" for row in cellules}
        cellule_id = st.selectbox("Cellule *", options=list(cellule_options.keys()), format_func=lambda x: cellule_options[x] if x in cellule_options else x)

        profession = st.text_input("Profession")
        date_adhesion = st.date_input("Date d'adhésion")
        responsable_recensement = st.text_input("Responsable de recensement")
        observations = st.text_area("Observations")

    submit = st.form_submit_button("Enregistrer le militant")

if submit:
    if not code_militant or not nom or not section_id or not cellule_id:
        st.error("Veuillez remplir les champs obligatoires (*)")
    else:
        try:
            c.execute('''
                INSERT INTO militants (
                    code_militant, nom, prenoms, sexe, date_naissance, lieu_naissance,
                    num_cni, num_carte_electeur, lieu_vote, bureau_vote, telephone_1,
                    quartier, code_cellule, code_section, profession, date_adhesion,
                    responsable_recensement, observations
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                code_militant, nom, prenoms, sexe, str(date_naissance), lieu_naissance,
                num_cni, num_carte_electeur, lieu_vote, bureau_vote, telephone_1,
                quartier, cellule_id, section_id, profession, str(date_adhesion),
                responsable_recensement, observations
            ))
            conn.commit()
            
            # Enregistrer l'action dans l'historique
            utilisateur = st.session_state.get('username', 'Inconnu')
            database.log_action(utilisateur, "Ajout", f"Militant {nom} ({code_militant}) ajouté dans cellule {cellule_id}")
            
            st.success(f"Militant {nom} ajouté avec succès !")
        except Exception as e:
            st.error(f"Erreur lors de l'ajout (le code militant existe peut-être déjà ?) : {e}")

conn.close()
