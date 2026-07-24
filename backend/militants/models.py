from django.db import models


class Section(models.Model):
    """Représente une section géographique ou structurelle du parti."""
    code_section = models.CharField(max_length=50, primary_key=True, verbose_name="Code Section")
    nom_section = models.CharField(max_length=200, verbose_name="Nom de la Section")
    responsable = models.CharField(max_length=200, blank=True, null=True, verbose_name="Responsable")

    class Meta:
        db_table = 'sections'
        verbose_name = "Section"
        verbose_name_plural = "Sections"
        ordering = ['code_section']

    def __str__(self):
        return f"{self.code_section} - {self.nom_section}"


class Cellule(models.Model):
    """Représente une cellule de base rattachée à une section."""
    code_cellule = models.CharField(max_length=50, primary_key=True, verbose_name="Code Cellule")
    nom_cellule = models.CharField(max_length=200, verbose_name="Nom de la Cellule")
    quartier = models.CharField(max_length=200, blank=True, null=True, verbose_name="Quartier")
    responsable = models.CharField(max_length=200, blank=True, null=True, verbose_name="Responsable")
    telephone = models.CharField(max_length=50, blank=True, null=True, verbose_name="Téléphone")
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        related_name='cellules',
        db_column='code_section',
        verbose_name="Section"
    )

    class Meta:
        db_table = 'cellules'
        verbose_name = "Cellule"
        verbose_name_plural = "Cellules"
        ordering = ['code_cellule']

    def __str__(self):
        return f"{self.code_cellule} - {self.nom_cellule}"


class Militant(models.Model):
    """Représente un militant ou sympathisant du parti."""
    SEXE_CHOICES = [
        ('Homme', 'Homme'),
        ('Femme', 'Femme'),
    ]

    code_militant = models.CharField(max_length=50, unique=True, verbose_name="Code Militant")
    nom = models.CharField(max_length=200, verbose_name="Nom")
    prenoms = models.CharField(max_length=200, blank=True, null=True, verbose_name="Prénom(s)")
    sexe = models.CharField(max_length=10, choices=SEXE_CHOICES, blank=True, null=True, verbose_name="Sexe")
    date_naissance = models.DateField(blank=True, null=True, verbose_name="Date de Naissance")
    lieu_naissance = models.CharField(max_length=200, blank=True, null=True, verbose_name="Lieu de Naissance")
    num_cni = models.CharField(max_length=100, blank=True, null=True, verbose_name="N° CNI")
    num_carte_electeur = models.CharField(max_length=100, blank=True, null=True, verbose_name="N° Carte Électeur")
    lieu_vote = models.CharField(max_length=200, blank=True, null=True, verbose_name="Lieu de Vote")
    bureau_vote = models.CharField(max_length=200, blank=True, null=True, verbose_name="Bureau de Vote")
    telephone_1 = models.CharField(max_length=50, blank=True, null=True, verbose_name="Téléphone")
    quartier = models.CharField(max_length=200, blank=True, null=True, verbose_name="Quartier")
    cellule = models.ForeignKey(
        Cellule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='militants',
        db_column='code_cellule',
        verbose_name="Cellule"
    )
    section = models.ForeignKey(
        Section,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='militants',
        db_column='code_section',
        verbose_name="Section"
    )
    profession = models.CharField(max_length=200, blank=True, null=True, verbose_name="Profession")
    date_adhesion = models.DateField(blank=True, null=True, verbose_name="Date d'Adhésion")
    responsable_recensement = models.CharField(max_length=200, blank=True, null=True, verbose_name="Responsable Recensement")
    observations = models.TextField(blank=True, null=True, verbose_name="Observations")

    class Meta:
        db_table = 'militants'
        verbose_name = "Militant"
        verbose_name_plural = "Militants"
        ordering = ['-id']

    def __str__(self):
        return f"{self.code_militant} - {self.nom} {self.prenoms or ''}"


class HistoriqueActivite(models.Model):
    """Journal des actions effectuées par les utilisateurs."""
    utilisateur = models.CharField(max_length=200, verbose_name="Utilisateur")
    action = models.CharField(max_length=100, verbose_name="Action")
    description = models.TextField(blank=True, null=True, verbose_name="Description")
    date_heure = models.DateTimeField(auto_now_add=True, verbose_name="Date & Heure")

    class Meta:
        db_table = 'historique_activites'
        verbose_name = "Historique d'Activité"
        verbose_name_plural = "Historique des Activités"
        ordering = ['-date_heure']

    def __str__(self):
        return f"[{self.date_heure}] {self.utilisateur}: {self.action}"
