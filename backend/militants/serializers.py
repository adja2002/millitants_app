from rest_framework import serializers
from .models import Section, Cellule, Militant, HistoriqueActivite


class SectionSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les sections avec compteurs."""
    cellules_count = serializers.SerializerMethodField()
    militants_count = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ['code_section', 'nom_section', 'responsable', 'cellules_count', 'militants_count']
        read_only_fields = ['code_section']

    def get_cellules_count(self, obj):
        return obj.cellules.count()

    def get_militants_count(self, obj):
        return obj.militants.count()


class SectionListSerializer(serializers.ModelSerializer):
    """Sérialiseur léger pour les listes déroulantes."""
    class Meta:
        model = Section
        fields = ['code_section', 'nom_section']


class CelluleSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les cellules avec infos section et compteur."""
    section_nom = serializers.CharField(source='section.nom_section', read_only=True)
    militants_count = serializers.SerializerMethodField()

    class Meta:
        model = Cellule
        fields = [
            'code_cellule', 'nom_cellule', 'quartier', 'responsable',
            'telephone', 'section', 'section_nom', 'militants_count'
        ]
        read_only_fields = ['code_cellule']

    def validate_section(self, value):
        if not self.instance: # only check on creation
            if value.cellules.count() >= 10:
                raise serializers.ValidationError("Cette section a atteint sa limite maximale de 10 cellules.")
        return value

    def get_militants_count(self, obj):
        return obj.militants.count()


class CelluleListSerializer(serializers.ModelSerializer):
    """Sérialiseur léger pour les listes déroulantes."""
    class Meta:
        model = Cellule
        fields = ['code_cellule', 'nom_cellule', 'section']


class MilitantSerializer(serializers.ModelSerializer):
    """Sérialiseur complet pour un militant."""
    section_nom = serializers.CharField(source='section.nom_section', read_only=True, default=None)
    cellule_nom = serializers.CharField(source='cellule.nom_cellule', read_only=True, default=None)

    class Meta:
        model = Militant
        fields = [
            'id', 'code_militant', 'nom', 'prenoms', 'sexe',
            'date_naissance', 'lieu_naissance', 'num_cni',
            'num_carte_electeur', 'lieu_vote', 'bureau_vote',
            'telephone_1', 'quartier', 'cellule', 'cellule_nom',
            'section', 'section_nom', 'profession', 'date_adhesion',
            'responsable_recensement', 'observations'
        ]
        read_only_fields = ['code_militant']

    def validate_cellule(self, value):
        if not self.instance and value: # only check on creation and if cellule is provided
            if value.militants.count() >= 50:
                raise serializers.ValidationError("Cette cellule a atteint sa limite maximale de 50 militants.")
        return value


class MilitantListSerializer(serializers.ModelSerializer):
    """Sérialiseur léger pour les listes de militants."""
    section_nom = serializers.CharField(source='section.nom_section', read_only=True, default=None)
    cellule_nom = serializers.CharField(source='cellule.nom_cellule', read_only=True, default=None)

    class Meta:
        model = Militant
        fields = [
            'id', 'code_militant', 'nom', 'prenoms', 'sexe',
            'telephone_1', 'cellule', 'cellule_nom',
            'section', 'section_nom', 'quartier'
        ]


class HistoriqueActiviteSerializer(serializers.ModelSerializer):
    """Sérialiseur pour l'historique des activités."""
    class Meta:
        model = HistoriqueActivite
        fields = ['id', 'utilisateur', 'action', 'description', 'date_heure']
        read_only_fields = ['date_heure']
