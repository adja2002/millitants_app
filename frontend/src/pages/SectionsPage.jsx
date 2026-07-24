import { useState, useEffect } from 'react';
import API from '../api/axios';

export default function SectionsPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nom_section: '', responsable: '' });

  useEffect(() => { loadSections(); }, []);

  const loadSections = async () => {
    setLoading(true);
    try {
      const res = await API.get('/sections/');
      setSections(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ nom_section: '', responsable: '' });
    setShowModal(true);
  };

  const openEdit = (section) => {
    setEditing(section);
    setForm({
      nom_section: section.nom_section,
      responsable: section.responsable || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.responsable) payload.responsable = null;

      if (editing) {
        await API.put(`/sections/${editing.code_section}/`, payload);
      } else {
        await API.post('/sections/', payload);
      }
      setShowModal(false);
      loadSections();
    } catch (err) {
      alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (section) => {
    if (!window.confirm(`Supprimer la section "${section.nom_section}" et toutes ses cellules/militants associés ?`)) return;
    try {
      await API.delete(`/sections/${section.code_section}/`);
      loadSections();
    } catch (err) {
      alert('Erreur lors de la suppression. Vérifiez qu\'il n\'y a pas de données dépendantes.');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="sections-page">
      <div className="toolbar">
        <div className="toolbar-left">
          <span className="result-count">{sections.length} section(s)</span>
        </div>
        <button className="btn btn-primary btn-add" onClick={openAdd}>
          + Ajouter une section
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          {loading ? (
            <div className="page-loading"><div className="spinner"></div></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Nom de la Section</th>
                  <th>Responsable</th>
                  <th>Cellules</th>
                  <th>Militants</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.length > 0 ? sections.map(s => (
                  <tr key={s.code_section}>
                    <td><strong>{s.code_section}</strong></td>
                    <td>{s.nom_section}</td>
                    <td>{s.responsable || '—'}</td>
                    <td><span className="badge badge-info">{s.cellules_count}</span></td>
                    <td><span className="badge badge-primary">{s.militants_count}</span></td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon btn-edit" title="Modifier" onClick={() => openEdit(s)}>✏️</button>
                        <button className="btn-icon btn-delete" title="Supprimer" onClick={() => handleDelete(s)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="empty-state">Aucune section trouvée</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? '✏️ Modifier la Section' : '➕ Nouvelle Section'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">

                <div className="input-group">
                  <label>Nom de la Section *</label>
                  <input name="nom_section" value={form.nom_section} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>Responsable</label>
                  <input name="responsable" value={form.responsable} onChange={handleChange} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : (editing ? 'Mettre à jour' : 'Enregistrer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
