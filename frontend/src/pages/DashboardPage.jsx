import { useState, useEffect } from 'react';
import API from '../api/axios';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [incompleteSections, setIncompleteSections] = useState([]);
  const [incompleteCellules, setIncompleteCellules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, histRes, sectionsRes, cellulesRes] = await Promise.all([
        API.get('/stats/'),
        API.get('/historique/?page_size=10'),
        API.get('/sections/'),
        API.get('/cellules/')
      ]);
      setStats(statsRes.data);
      setHistorique(histRes.data.results || histRes.data || []);
      
      const incompSec = (sectionsRes.data.results || sectionsRes.data || []).filter(s => s.cellules_count < 10);
      const incompCel = (cellulesRes.data.results || cellulesRes.data || []).filter(c => c.militants_count < 50);
      
      setIncompleteSections(incompSec);
      setIncompleteCellules(incompCel);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="dashboard-view">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Total Militants</h3>
            <p className="stat-number">{stats?.militants || 0}</p>
          </div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-icon">🏛️</div>
          <div className="stat-info">
            <h3>Sections</h3>
            <p className="stat-number">{stats?.sections || 0}</p>
          </div>
        </div>
        <div className="stat-card stat-card-info">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <h3>Cellules</h3>
            <p className="stat-number">{stats?.cellules || 0}</p>
          </div>
        </div>
      </div>

      {/* Gender Distribution */}
      <div className="dashboard-row">
        <div className="card dashboard-card">
          <h3 className="card-title">📊 Répartition par Sexe</h3>
          <div className="gender-stats">
            <div className="gender-bar-container">
              <div className="gender-item">
                <span className="gender-label">Hommes</span>
                <div className="gender-bar">
                  <div
                    className="gender-fill gender-male"
                    style={{
                      width: stats?.militants > 0
                        ? `${(stats.hommes / stats.militants) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
                <span className="gender-count">{stats?.hommes || 0}</span>
              </div>
              <div className="gender-item">
                <span className="gender-label">Femmes</span>
                <div className="gender-bar">
                  <div
                    className="gender-fill gender-female"
                    style={{
                      width: stats?.militants > 0
                        ? `${(stats.femmes / stats.militants) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
                <span className="gender-count">{stats?.femmes || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card dashboard-card">
          <h3 className="card-title">🏆 Top Sections</h3>
          <div className="top-sections-list">
            {stats?.top_sections?.length > 0 ? (
              stats.top_sections.map((s, i) => (
                <div key={s.code_section} className="top-section-item">
                  <span className="top-rank">#{i + 1}</span>
                  <span className="top-name">{s.nom_section}</span>
                  <span className="top-count badge">{s.militants_count} militants</span>
                </div>
              ))
            ) : (
              <p className="empty-state">Aucune donnée disponible</p>
            )}
          </div>
        </div>
      </div>
      {/* Quotas Incomplets */}
      <div className="dashboard-row">
        <div className="card dashboard-card">
          <h3 className="card-title">⚠️ Sections Incomplètes</h3>
          <p className="subtitle" style={{marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)'}}>Minimum de 10 cellules requises</p>
          <div className="top-sections-list">
            {incompleteSections.length > 0 ? (
              incompleteSections.slice(0, 5).map(s => (
                <div key={s.code_section} className="top-section-item">
                  <span className="top-name">{s.nom_section}</span>
                  <span className="top-count badge badge-warning">{s.cellules_count} / 10 cellules</span>
                </div>
              ))
            ) : (
              <p className="empty-state">Toutes les sections ont atteint leur quota ! 🎉</p>
            )}
          </div>
        </div>

        <div className="card dashboard-card">
          <h3 className="card-title">⚠️ Cellules Incomplètes</h3>
          <p className="subtitle" style={{marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)'}}>Minimum de 50 militants requis</p>
          <div className="top-sections-list">
            {incompleteCellules.length > 0 ? (
              incompleteCellules.slice(0, 5).map(c => (
                <div key={c.code_cellule} className="top-section-item">
                  <span className="top-name">{c.nom_cellule} ({c.section_nom})</span>
                  <span className="top-count badge badge-warning">{c.militants_count} / 50 militants</span>
                </div>
              ))
            ) : (
              <p className="empty-state">Toutes les cellules ont atteint leur quota ! 🎉</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="card-title" style={{ padding: '1.5rem 2rem 0' }}>📋 Activité Récente</h3>
        <div className="activity-list">
          {historique.length > 0 ? (
            historique.slice(0, 8).map((h) => (
              <div key={h.id} className="activity-item">
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <span className="activity-action">
                    <strong>{h.utilisateur}</strong> — {h.action}
                  </span>
                  <span className="activity-desc">{h.description}</span>
                  <span className="activity-time">
                    {new Date(h.date_heure).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state" style={{ padding: '2rem' }}>
              Aucune activité enregistrée pour le moment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
