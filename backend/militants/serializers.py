from rest_framework import serializers
from .models import Section, Cellule, Militant, HistoriqueActivite, UserProfile
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer



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


class UserSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les utilisateurs et leurs rôles."""
    role = serializers.CharField(source='profile.role', required=False)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'is_active']
    
    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        role = profile_data.get('role', 'SAISISSEUR')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data.get('password')
        )
        # Create profile automatically
        UserProfile.objects.create(user=user, role=role)
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        
        # Update User fields
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        
        if 'password' in validated_data and validated_data['password']:
            instance.set_password(validated_data['password'])
            
        instance.save()
        
        # Update or create Profile fields
        if profile_data:
            role = profile_data.get('role')
            if role:
                profile, created = UserProfile.objects.get_or_create(user=instance)
                profile.role = role
                profile.save()
                
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Surcharge du JWT pour inclure le rôle."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        try:
            token['role'] = user.profile.role
        except UserProfile.DoesNotExist:
            if user.is_superuser or user.is_staff:
                token['role'] = 'ADMIN'
            else:
                token['role'] = 'SAISISSEUR'
        return token

