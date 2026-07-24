from rest_framework import viewsets, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from .models import Section, Cellule, Militant, HistoriqueActivite
from .serializers import (
    SectionSerializer, SectionListSerializer,
    CelluleSerializer, CelluleListSerializer,
    MilitantSerializer, MilitantListSerializer,
    HistoriqueActiviteSerializer,
)


def log_action(user, action, description=""):
    """Enregistre une action dans l'historique."""
    HistoriqueActivite.objects.create(
        utilisateur=user.username if hasattr(user, 'username') else str(user),
        action=action,
        description=description
    )


# --- User Info ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Retourne les informations de l'utilisateur connecté."""
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'role': 'admin' if user.is_superuser else ('staff' if user.is_staff else 'user'),
    })


# --- Statistics ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stats_view(request):
    """Retourne les statistiques globales pour le dashboard."""
    militants_count = Militant.objects.count()
    sections_count = Section.objects.count()
    cellules_count = Cellule.objects.count()

    # Répartition par sexe
    hommes = Militant.objects.filter(sexe='Homme').count()
    femmes = Militant.objects.filter(sexe='Femme').count()

    # Top 5 sections par nombre de militants
    top_sections = []
    for section in Section.objects.all()[:10]:
        count = section.militants.count()
        if count > 0:
            top_sections.append({
                'code_section': section.code_section,
                'nom_section': section.nom_section,
                'militants_count': count
            })
    top_sections.sort(key=lambda x: x['militants_count'], reverse=True)

    return Response({
        'militants': militants_count,
        'sections': sections_count,
        'cellules': cellules_count,
        'hommes': hommes,
        'femmes': femmes,
        'top_sections': top_sections[:5],
    })


# --- Sections ViewSet ---
class SectionViewSet(viewsets.ModelViewSet):
    """CRUD complet pour les sections."""
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Pas de pagination pour les sections (nombre limité)

    def get_serializer_class(self):
        if self.action == 'list' and self.request.query_params.get('light') == 'true':
            return SectionListSerializer
        return SectionSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, "Ajout Section", f"Section '{instance.nom_section}' ({instance.code_section}) créée")

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, "Modification Section", f"Section '{instance.nom_section}' ({instance.code_section}) modifiée")

    def perform_destroy(self, instance):
        log_action(self.request.user, "Suppression Section", f"Section '{instance.nom_section}' ({instance.code_section}) supprimée")
        instance.delete()


# --- Cellules ViewSet ---
class CelluleViewSet(viewsets.ModelViewSet):
    """CRUD complet pour les cellules avec filtrage par section."""
    queryset = Cellule.objects.select_related('section').all()
    serializer_class = CelluleSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_serializer_class(self):
        if self.action == 'list' and self.request.query_params.get('light') == 'true':
            return CelluleListSerializer
        return CelluleSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        section = self.request.query_params.get('section')
        if section:
            queryset = queryset.filter(section_id=section)
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, "Ajout Cellule", f"Cellule '{instance.nom_cellule}' ({instance.code_cellule}) créée")

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(self.request.user, "Modification Cellule", f"Cellule '{instance.nom_cellule}' ({instance.code_cellule}) modifiée")

    def perform_destroy(self, instance):
        log_action(self.request.user, "Suppression Cellule", f"Cellule '{instance.nom_cellule}' ({instance.code_cellule}) supprimée")
        instance.delete()


# --- Militants ViewSet ---
class MilitantViewSet(viewsets.ModelViewSet):
    """CRUD complet pour les militants avec recherche et filtrage."""
    queryset = Militant.objects.select_related('section', 'cellule').all()
    serializer_class = MilitantSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return MilitantListSerializer
        return MilitantSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Recherche textuelle
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) |
                Q(prenoms__icontains=search) |
                Q(code_militant__icontains=search) |
                Q(telephone_1__icontains=search)
            )

        # Filtrage par section
        section = self.request.query_params.get('section')
        if section:
            queryset = queryset.filter(section_id=section)

        # Filtrage par cellule
        cellule = self.request.query_params.get('cellule')
        if cellule:
            queryset = queryset.filter(cellule_id=cellule)

        # Filtrage par sexe
        sexe = self.request.query_params.get('sexe')
        if sexe:
            queryset = queryset.filter(sexe=sexe)

        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(
            self.request.user,
            "Ajout Militant",
            f"Militant '{instance.nom} {instance.prenoms or ''}' ({instance.code_militant}) ajouté"
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        log_action(
            self.request.user,
            "Modification Militant",
            f"Militant '{instance.nom} {instance.prenoms or ''}' ({instance.code_militant}) modifié"
        )

    def perform_destroy(self, instance):
        log_action(
            self.request.user,
            "Suppression Militant",
            f"Militant '{instance.nom} {instance.prenoms or ''}' ({instance.code_militant}) supprimé"
        )
        instance.delete()


# --- Historique ViewSet (lecture seule) ---
class HistoriqueViewSet(viewsets.ReadOnlyModelViewSet):
    """Lecture seule pour l'historique des activités."""
    queryset = HistoriqueActivite.objects.all()
    serializer_class = HistoriqueActiviteSerializer
    permission_classes = [IsAuthenticated]
