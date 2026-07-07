import streamlit as st
import database
import auth
import pandas as pd
import plotly.express as px
import ui

st.set_page_config(page_title="Tableau de Bord", page_icon="📊", layout="wide")
ui.load_css()
auth.require_admin()

st.title("Tableau de Bord (Administrateur)")

import os
col_logo, col_titre = st.columns([1, 4])
with col_logo:
    if os.path.exists("images/photo_candidat.jpeg"):
        st.image("images/photo_candidat.jpeg", width=150)
with col_titre:
    st.write("Bienvenue sur l'espace d'analyse de la campagne. Vous trouverez ici un résumé en temps réel de tous les enregistrements effectués sur le terrain.")

conn = database.get_connection()

# Charger les données avec Pandas pour l'analyse
query = '''
    SELECT m.*, s.nom_section, c.nom_cellule 
    FROM militants m
    LEFT JOIN sections s ON m.code_section = s.code_section
    LEFT JOIN cellules c ON m.code_cellule = c.code_cellule
'''
df = pd.read_sql_query(query, conn)
conn.close()

if df.empty:
    st.info("Aucune donnée disponible pour le moment.")
else:
    # Indicateurs clés (KPIs)
    st.header("Performance et Objectifs")
    col1, col2, col3 = st.columns(3)
    
    # Calcul des objectifs pour les Cellules (Minimum 50 militants)
    cellules_counts = df.groupby('code_cellule').size().reset_index(name='count')
    cellules_validees = len(cellules_counts[cellules_counts['count'] >= 50])
    total_cellules = df['code_cellule'].nunique()
    
    # Chargement du total réel des cellules/sections pour les stats
    df_sec = pd.read_sql_query("SELECT code_section FROM sections", conn)
    df_cel = pd.read_sql_query("SELECT code_cellule, code_section FROM cellules", conn)
    
    # Calcul des objectifs pour les Sections (Minimum 10 cellules)
    sections_cel_counts = df_cel.groupby('code_section').size().reset_index(name='cel_count')
    sections_validees = len(sections_cel_counts[sections_cel_counts['cel_count'] >= 10])
    total_sections = len(df_sec)
    
    with col1:
        st.metric("Total Militants Inscrits", len(df))
    with col2:
        st.metric("Cellules avec Objectif Atteint (>= 50)", f"{cellules_validees} / {len(df_cel)}")
    with col3:
        st.metric("Sections avec Objectif Atteint (>= 10)", f"{sections_validees} / {total_sections}")

    st.markdown("---")

    # Graphiques
    col_chart1, col_chart2 = st.columns(2)

    with col_chart1:
        st.subheader("Remplissage des Cellules (Top 10)")
        if not cellules_counts.empty:
            # Récupérer les noms
            cellules_counts = cellules_counts.merge(df[['code_cellule', 'nom_cellule']].drop_duplicates(), on='code_cellule')
            # Trier et prendre les 10 premières
            cellules_counts = cellules_counts.sort_values(by='count', ascending=False).head(10)
            fig_cel = px.bar(cellules_counts, x='nom_cellule', y='count', color='count',
                             title="Nombre de militants par cellule (Ligne rouge = Objectif 50)")
            fig_cel.add_hline(y=50, line_dash="dash", line_color="red", annotation_text="Objectif: 50")
            st.plotly_chart(fig_cel, use_container_width=True)

    with col_chart2:
        st.subheader("Militants par Section")
        section_counts = df['nom_section'].value_counts().reset_index()
        section_counts.columns = ['Section', 'Nombre']
        fig_section = px.bar(section_counts, x='Section', y='Nombre', text='Nombre', color='Section')
        fig_section.update_traces(textposition='outside')
        st.plotly_chart(fig_section, use_container_width=True)

    st.markdown("---")

    st.subheader("Base de données brute (Vue administrateur)")
    st.dataframe(df.drop(columns=['id']), use_container_width=True)

    # Exporter les données
    csv = df.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="Télécharger les données au format CSV",
        data=csv,
        file_name='militants_export.csv',
        mime='text/csv',
    )
