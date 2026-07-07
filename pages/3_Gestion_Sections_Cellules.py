import streamlit as st
import database
import auth
import pandas as pd
import ui

st.set_page_config(page_title="Gestion Sections & Cellules", page_icon="⚙️", layout="wide")
ui.load_css()
auth.require_admin()

st.title("Gestion des Sections et Cellules")

conn = database.get_connection()
c = conn.cursor()

tab1, tab2 = st.tabs(["Sections", "Cellules"])

# --- GESTION DES SECTIONS ---
with tab1:
    st.header("Ajouter une Section")
    with st.form("form_section", clear_on_submit=True):
        code_section = st.text_input("Code Section *")
        nom_section = st.text_input("Nom de la Section *")
        responsable_sec = st.text_input("Responsable de la Section")
        
        submit_sec = st.form_submit_button("Ajouter la section")
        if submit_sec:
            if not code_section or not nom_section:
                st.error("Les champs avec * sont obligatoires.")
            else:
                try:
                    c.execute("INSERT INTO sections (code_section, nom_section, responsable) VALUES (%s, %s, %s)",
                              (code_section, nom_section, responsable_sec))
                    conn.commit()
                    
                    utilisateur = st.session_state.get('username', 'Inconnu')
                    database.log_action(utilisateur, "Ajout", f"Section {nom_section} ({code_section})")
                    
                    st.success("Section ajoutée !")
                except Exception as e:
                    st.error(f"Erreur (le code existe peut-être déjà ?) : {e}")
    
    st.subheader("Liste des sections existantes")
    sections_df = pd.read_sql_query("SELECT * FROM sections", conn)
    st.dataframe(sections_df, use_container_width=True)


# --- GESTION DES CELLULES ---
with tab2:
    st.header("Ajouter une Cellule")
    
    # Recharger les sections pour le menu déroulant
    c.execute("SELECT code_section, nom_section FROM sections")
    sections_data = c.fetchall()
    sec_options = {row['code_section']: f"{row['code_section']} - {row['nom_section']}" for row in sections_data}

    if not sec_options:
        st.warning("Veuillez d'abord créer au moins une Section avant de pouvoir créer une Cellule.")
    else:
        with st.form("form_cellule", clear_on_submit=True):
            code_cellule = st.text_input("Code Cellule *")
            nom_cellule = st.text_input("Nom de la Cellule *")
            quartier = st.text_input("Quartier")
            responsable_cel = st.text_input("Responsable de la Cellule")
            telephone_cel = st.text_input("Téléphone")
            section_liee = st.selectbox("Appartient à la section *", options=list(sec_options.keys()), format_func=lambda x: sec_options[x])
            
            submit_cel = st.form_submit_button("Ajouter la cellule")
            if submit_cel:
                if not code_cellule or not nom_cellule or not section_liee:
                    st.error("Les champs avec * sont obligatoires.")
                else:
                    try:
                        c.execute('''
                            INSERT INTO cellules (code_cellule, nom_cellule, quartier, responsable, telephone, code_section)
                            VALUES (%s, %s, %s, %s, %s, %s)
                        ''', (code_cellule, nom_cellule, quartier, responsable_cel, telephone_cel, section_liee))
                        conn.commit()
                        
                        utilisateur = st.session_state.get('username', 'Inconnu')
                        database.log_action(utilisateur, "Ajout", f"Cellule {nom_cellule} ({code_cellule}) dans section {section_liee}")
                        
                        st.success("Cellule ajoutée !")
                    except Exception as e:
                        st.error(f"Erreur : {e}")
    
    st.subheader("Liste des cellules existantes")
    cellules_df = pd.read_sql_query("SELECT c.*, s.nom_section FROM cellules c LEFT JOIN sections s ON c.code_section = s.code_section", conn)
    st.dataframe(cellules_df, use_container_width=True)

conn.close()
