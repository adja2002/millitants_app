import streamlit as st
import os

def load_css():
    if os.path.exists("images/logo.jpeg"):
        st.logo("images/logo.jpeg")
        
    st.markdown("""
        <style>
        /* Masquer le menu principal de Streamlit et le footer pour un look plus "App" */
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
        
        /* Personnalisation des boutons */
        .stButton>button {
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .stButton>button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        /* Personnalisation des indicateurs (Metrics) façon "Glassmorphism" */
        div[data-testid="metric-container"] {
            background-color: white;
            border: 1px solid rgba(229, 231, 235, 1);
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
        }
        div[data-testid="metric-container"]:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            border-color: #1E3A8A;
        }
        
        /* Personnalisation des Inputs (Formulaires) */
        .stTextInput>div>div>input {
            border-radius: 6px;
        }
        
        /* Personnalisation du style du tableau de données */
        .stDataFrame {
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        
        /* Titres avec léger dégradé */
        h1 {
            background: -webkit-linear-gradient(45deg, #1E3A8A, #3B82F6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 800;
        }
        </style>
    """, unsafe_allow_html=True)
