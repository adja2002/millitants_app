from django.contrib import admin
from .models import Section, Cellule, Militant, HistoriqueActivite


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['code_section', 'nom_section', 'responsable']
    search_fields = ['code_section', 'nom_section', 'responsable']


@admin.register(Cellule)
class CelluleAdmin(admin.ModelAdmin):
    list_display = ['code_cellule', 'nom_cellule', 'quartier', 'responsable', 'telephone', 'section']
    list_filter = ['section']
    search_fields = ['code_cellule', 'nom_cellule', 'quartier', 'responsable']


@admin.register(Militant)
class MilitantAdmin(admin.ModelAdmin):
    list_display = ['code_militant', 'nom', 'prenoms', 'sexe', 'telephone_1', 'section', 'cellule']
    list_filter = ['sexe', 'section', 'cellule']
    search_fields = ['code_militant', 'nom', 'prenoms', 'num_cni', 'num_carte_electeur', 'telephone_1']
    list_per_page = 50


@admin.register(HistoriqueActivite)
class HistoriqueActiviteAdmin(admin.ModelAdmin):
    list_display = ['date_heure', 'utilisateur', 'action', 'description']
    list_filter = ['action', 'utilisateur']
    search_fields = ['utilisateur', 'action', 'description']
    readonly_fields = ['date_heure']
    list_per_page = 50
