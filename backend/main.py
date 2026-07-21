from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional
from backend import models
from backend import auth
from backend.database import get_db_connection, init_db, log_action
from datetime import timedelta
import os

app = FastAPI(title="Militants API")

# Configure CORS for Vite frontend (or other local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, change to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.on_event("startup")
def startup_event():
    init_db()

@app.post("/token", response_model=models.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = auth.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user["nom_utilisateur"], "role": user["role"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(auth.get_current_user)):
    return {"username": current_user["nom_utilisateur"], "role": current_user["role"]}

# --- Sections ---
@app.get("/sections")
def get_sections(current_user: dict = Depends(auth.get_current_user)):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM sections")
    sections = c.fetchall()
    conn.close()
    return sections

# --- Cellules ---
@app.get("/cellules")
def get_cellules(current_user: dict = Depends(auth.get_current_user)):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM cellules")
    cellules = c.fetchall()
    conn.close()
    return cellules

# --- Militants ---
@app.get("/militants")
def get_militants(current_user: dict = Depends(auth.get_current_user)):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM militants")
    militants = c.fetchall()
    conn.close()
    return militants

@app.post("/militants", status_code=status.HTTP_201_CREATED)
def create_militant(militant: models.MilitantCreate, current_user: dict = Depends(auth.get_current_user)):
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        c.execute('''
            INSERT INTO militants (
                code_militant, nom, prenoms, sexe, date_naissance, lieu_naissance,
                num_cni, num_carte_electeur, lieu_vote, bureau_vote, telephone_1,
                quartier, code_cellule, code_section, profession, date_adhesion,
                responsable_recensement, observations
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            militant.code_militant, militant.nom, militant.prenoms, militant.sexe, 
            str(militant.date_naissance) if militant.date_naissance else None, 
            militant.lieu_naissance,
            militant.num_cni, militant.num_carte_electeur, militant.lieu_vote, 
            militant.bureau_vote, militant.telephone_1,
            militant.quartier, militant.code_cellule, militant.code_section, 
            militant.profession, 
            str(militant.date_adhesion) if militant.date_adhesion else None,
            militant.responsable_recensement, militant.observations
        ))
        conn.commit()
        log_action(current_user["nom_utilisateur"], "Ajout", f"Militant {militant.nom} ({militant.code_militant}) ajouté")
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))
    
    conn.close()
    return {"msg": "Militant created successfully"}

@app.get("/stats")
def get_stats(current_user: dict = Depends(auth.get_current_user)):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as count FROM militants")
    militants_count = c.fetchone()["count"]
    c.execute("SELECT COUNT(*) as count FROM sections")
    sections_count = c.fetchone()["count"]
    c.execute("SELECT COUNT(*) as count FROM cellules")
    cellules_count = c.fetchone()["count"]
    conn.close()
    
    return {
        "militants": militants_count,
        "sections": sections_count,
        "cellules": cellules_count
    }

# Serve Frontend static files - MUST BE LAST
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
