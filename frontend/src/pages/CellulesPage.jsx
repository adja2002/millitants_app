import { useState, useEffect } from 'react';
import API from '../api/axios';

export default function CellulesPage() {
  const [cellules, setCellules] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterSection, setFilterSection] = useState('');
  const [form, setForm] = useState({
    code_cellule: '', nom_cellule: '', quartier: '',
    responsable: '', telephone: '', section: ''
  });

  useEffect(() => {
    loadSections();
  }, []);

  useEffect(() => {
    loadCellules();
  }, [filterSection]);

  const loadSections = async () => {
    try {
      const res = await API.get('/sections/?light=true');
      setSections(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCellules = async () => {
    setLoading(true);
    try {
      const url = filterSection ? `/cellules/?section=${filterSection}` : '/cellules/';
      const res = await API.get(url);
      setCellules(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ code_cellule: '', nom_cellule: '', quartier: '', responsable: '', telephone: '', section: '' });
    setShowModal(true);
  };

  const openEdit = (cellule) => {
    setEditing(cellule);
    setForm({
      code_cellule: cellule.code_cellule,
      nom_cellule: cellule.nom_cellule,
      quartier: cellule.quartier || '',
      responsable: cellule.responsable || '',
      telephone: cellule.telephone || '',
      section: cellule.section || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      ['quartier', 'responsable', 'telephone'].forEach(k => {
        if (!payload[k]) payload[k] = null;
      });

      if (editing) {
        await API.put(`/cellules/${editing.code_cellule}/`, payload);
      } else {
        await API.post('/cellules/', payload);
      }
      setShowModal(false);
      loadCellules();
    } catch (err) {
      alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cellule) => {
    if (!window.confirm(`Supprimer la cellule "${cellule.nom_cellule}" ?`)) return;
    try {
      await API.delete(`/cellules/${cellule.code_cellule}/`);
      loadCellules();
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="cellules-page">
      <div className="toolbar">
        <div className="toolbar-left">
          <select
            className="filter-select"
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
          >
            <option value="">Toutes les sections</option>
            {sections.map(s => (
              <option key={s.code_section} value={s.code_section}>{s.nom_section}</option>
            ))}
          </select>
          <span className="result-count">{cellules.length} cellule(s)</span>
        </div>
        <button className="btn btn-primary btn-add" onClick={openAdd}>
          + Ajouter une cellule
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
                  <th>Nom de la Cellule</th>
                  <th>Quartier</th>
                  <th>Responsable</th>
                  <th>Téléphone</th>
                  <th>Section</th>
                  <th>Militants</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cellules.length > 0 ? cellules.map(c => (
                  <tr key={c.code_cellule}>
                    <td><strong>{c.code_cellule}</strong></td>
                    <td>{c.nom_cellule}</td>
                    <td>{c.quartier || '—'}</td>
                    <td>{c.responsable || '—'}</td>
                    <td>{c.telephone || '—'}</td>
                    <td><span className="badge badge-section">{c.section_nom || c.section || '—'}</span></td>
                    <td><span className="badge badge-primary">{c.militants_count}</span></td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon btn-edit" title="Modifier" onClick={() => openEdit(c)}>✏️</button>
                        <button className="btn-icon btn-delete" title="Supprimer" onClick={() => handleDelete(c)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="8" className="empty-state">Aucune cellule trouvée</td></tr>
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
              <h2>{editing ? '✏️ Modifier la Cellule' : '➕ Nouvelle Cellule'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group">
                    <label>Code Cellule *</label>
                    <input name="code_cellule" value={form.code_cellule} onChange={handleChange} required disabled={!!editing} />
                  </div>
                  <div className="input-group">
                    <label>Nom de la Cellule *</label>
                    <input name="nom_cellule" value={form.nom_cellule} onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                    <label>Quartier</label>
                    <input name="quartier" value={form.quartier} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label>Responsable</label>
                    <input name="responsable" value={form.responsable} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label>Téléphone</label>
                    <input name="telephone" value={form.telephone} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label>Section *</label>
                    <select name="section" value={form.section} onChange={handleChange} required>
                      <option value="">— Sélectionnez —</option>
                      {sections.map(s => (
                        <option key={s.code_section} value={s.code_section}>{s.nom_section}</option>
                      ))}
                    </select>
                  </div>
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
