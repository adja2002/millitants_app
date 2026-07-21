from pydantic import BaseModel
from typing import Optional, List

class UserLogin(BaseModel):
    username: str
    password: str

class SectionBase(BaseModel):
    code_section: str
    nom_section: str
    responsable: Optional[str] = None

class SectionCreate(SectionBase):
    pass

class CelluleBase(BaseModel):
    code_cellule: str
    nom_cellule: str
    quartier: Optional[str] = None
    responsable: Optional[str] = None
    telephone: Optional[str] = None
    code_section: str

class CelluleCreate(CelluleBase):
    pass

class MilitantBase(BaseModel):
    code_militant: str
    nom: str
    prenoms: Optional[str] = None
    sexe: Optional[str] = None
    date_naissance: Optional[str] = None
    lieu_naissance: Optional[str] = None
    num_cni: Optional[str] = None
    num_carte_electeur: Optional[str] = None
    lieu_vote: Optional[str] = None
    bureau_vote: Optional[str] = None
    telephone_1: Optional[str] = None
    quartier: Optional[str] = None
    code_cellule: str
    code_section: str
    profession: Optional[str] = None
    date_adhesion: Optional[str] = None
    responsable_recensement: Optional[str] = None
    observations: Optional[str] = None

class MilitantCreate(MilitantBase):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
