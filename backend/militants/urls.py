from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'sections', views.SectionViewSet)
router.register(r'cellules', views.CelluleViewSet)
router.register(r'militants', views.MilitantViewSet)
router.register(r'historique', views.HistoriqueViewSet)

urlpatterns = [
    path('users/me/', views.current_user, name='current-user'),
    path('stats/', views.stats_view, name='stats'),
    path('', include(router.urls)),
]
