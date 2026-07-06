import streamlit as st
import database
import auth
import pandas as pd

st.set_page_config(page_title="Historique des Activités", page_icon="📜", layout="wide")
auth.require_admin()

st.title("Historique des Activités (Audit Log)")

conn = database.get_connection()

st.write("Ce tableau de bord enregistre toutes les actions importantes effectuées par les utilisateurs (ajouts, modifications).")

try:
    df_historique = pd.read_sql_query("SELECT id, utilisateur, action, description, date_heure FROM historique_activites ORDER BY date_heure DESC", conn)
    
    if df_historique.empty:
        st.info("Aucune activité enregistrée pour le moment.")
    else:
        # Filtres optionnels
        col1, col2 = st.columns(2)
        with col1:
            filtre_user = st.multiselect("Filtrer par utilisateur", options=df_historique['utilisateur'].unique())
        with col2:
            filtre_action = st.multiselect("Filtrer par type d'action", options=df_historique['action'].unique())
            
        if filtre_user:
            df_historique = df_historique[df_historique['utilisateur'].isin(filtre_user)]
        if filtre_action:
            df_historique = df_historique[df_historique['action'].isin(filtre_action)]
            
        st.dataframe(df_historique, use_container_width=True)

        # Bouton d'export
        csv = df_historique.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="Télécharger le journal d'activité (CSV)",
            data=csv,
            file_name='historique_activites.csv',
            mime='text/csv',
        )

except Exception as e:
    st.error(f"Impossible de lire l'historique : {e}. Assurez-vous que la base de données est à jour.")

conn.close()
