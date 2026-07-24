import { useState, useEffect } from 'react';
import API from '../api/axios';

export default function MilitantsPage() {
  const [militants, setMilitants] = useState([]);
  const [sections, setSections] = useState([]);
  const [cellules, setCellules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingMilitant, setEditingMilitant] = useState(null);
  const [detailMilitant, setDetailMilitant] = useState(null);
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterCellule, setFilterCellule] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    nom: '', prenoms: '', sexe: 'Homme',
    date_naissance: '', lieu_naissance: '', num_cni: '',
    num_carte_electeur: '', lieu_vote: '', bureau_vote: '',
    telephone_1: '', quartier: '', cellule: '', section: '',
    profession: '', date_adhesion: '', responsable_recensement: '',
    observations: ''
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadSectionsAndCellules();
  }, []);

  useEffect(() => {
    loadMilitants();
  }, [search, filterSection, filterCellule, currentPage]);

  const loadSectionsAndCellules = async () => {
    try {
      const [secRes, celRes] = await Promise.all([
        API.get('/sections/?light=true'),
        API.get('/cellules/?light=true'),
      ]);
      setSections(secRes.data);
      setCellules(celRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMilitants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterSection) params.append('section', filterSection);
      if (filterCellule) params.append('cellule', filterCellule);
      params.append('page', currentPage);

      const res = await API.get(`/militants/?${params.toString()}`);
      if (res.data.results) {
        setMilitants(res.data.results);
        setTotalCount(res.data.count);
      } else {
        setMilitants(res.data);
        setTotalCount(res.data.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingMilitant(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = async (militant) => {
    try {
      const res = await API.get(`/militants/${militant.id}/`);
      const data = res.data;
      setEditingMilitant(data);
      setForm({
        nom: data.nom || '',
        prenoms: data.prenoms || '',
        sexe: data.sexe || 'Homme',
        date_naissance: data.date_naissance || '',
        lieu_naissance: data.lieu_naissance || '',
        num_cni: data.num_cni || '',
        num_carte_electeur: data.num_carte_electeur || '',
        lieu_vote: data.lieu_vote || '',
        bureau_vote: data.bureau_vote || '',
        telephone_1: data.telephone_1 || '',
        quartier: data.quartier || '',
        cellule: data.cellule || '',
        section: data.section || '',
        profession: data.profession || '',
        date_adhesion: data.date_adhesion || '',
        responsable_recensement: data.responsable_recensement || '',
        observations: data.observations || '',
      });
      setShowModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const openDetail = async (militant) => {
    try {
      const res = await API.get(`/militants/${militant.id}/`);
      setDetailMilitant(res.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      // Clean empty strings to null
      Object.keys(payload).forEach(k => {
        if (payload[k] === '') payload[k] = null;
      });
      // Required fields must not be null
      payload.nom = form.nom;

      if (editingMilitant) {
        await API.put(`/militants/${editingMilitant.id}/`, payload);
      } else {
        await API.post('/militants/', payload);
      }
      setShowModal(false);
      loadMilitants();
    } catch (err) {
      alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (militant) => {
    if (!window.confirm(`Supprimer le militant "${militant.nom} ${militant.prenoms || ''}" ?`)) return;
    try {
      await API.delete(`/militants/${militant.id}/`);
      loadMilitants();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const filteredCellules = filterSection
    ? cellules.filter(c => c.section === filterSection)
    : cellules;

  const formCellules = form.section
    ? cellules.filter(c => c.section === form.section)
    : cellules;

  const totalPages = Math.ceil(totalCount / 50);

  return (
    <div className="militants-page">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, code..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select
            className="filter-select"
            value={filterSection}
            onChange={(e) => { setFilterSection(e.target.value); setFilterCellule(''); setCurrentPage(1); }}
          >
            <option value="">Toutes les sections</option>
            {sections.map(s => (
              <option key={s.code_section} value={s.code_section}>{s.nom_section}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filterCellule}
            onChange={(e) => { setFilterCellule(e.target.value); setCurrentPage(1); }}
          >
            <option value="">Toutes les cellules</option>
            {filteredCellules.map(c => (
              <option key={c.code_cellule} value={c.code_cellule}>{c.nom_cellule}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary btn-add" onClick={openAdd}>
          + Ajouter un militant
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-info">
          <span>{totalCount} militant(s) trouvé(s)</span>
        </div>
        <div className="table-responsive">
          {loading ? (
            <div className="page-loading"><div className="spinner"></div></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Nom</th>
                  <th>Prénom(s)</th>
                  <th>Sexe</th>
                  <th>Téléphone</th>
                  <th>Section</th>
                  <th>Cellule</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {militants.length > 0 ? militants.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.code_militant}</strong></td>
                    <td>{m.nom}</td>
                    <td>{m.prenoms || '—'}</td>
                    <td>
                      <span className={`badge badge-${m.sexe === 'Homme' ? 'male' : 'female'}`}>
                        {m.sexe || '—'}
                      </span>
                    </td>
                    <td>{m.telephone_1 || '—'}</td>
                    <td><span className="badge badge-section">{m.section_nom || m.section || '—'}</span></td>
                    <td>{m.cellule_nom || m.cellule || '—'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon btn-view" title="Voir" onClick={() => openDetail(m)}>👁️</button>
                        <button className="btn-icon btn-edit" title="Modifier" onClick={() => openEdit(m)}>✏️</button>
                        <button className="btn-icon btn-delete" title="Supprimer" onClick={() => handleDelete(m)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="8" className="empty-state">Aucun militant trouvé</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-outline btn-sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >← Précédent</button>
            <span className="page-info">Page {currentPage} / {totalPages}</span>
            <button
              className="btn btn-outline btn-sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >Suivant →</button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMilitant ? '✏️ Modifier le Militant' : '➕ Nouveau Militant'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">

                  <div className="input-group">
                    <label>Nom *</label>
                    <input name="nom" value={form.nom} onChange={handleChange} required />
                  </div>
                  <div className="input-group">
                    <label>Prénom(s)</label>
                    <input name="prenoms" value={form.prenoms} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label>Sexe</label>
                    <select name="sexe" value={form.sexe} onChange={handleChange}>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Date de Naissance</label>
                    <input type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label>Lieu de Naissance</label>
                    <input name="lieu_naissance" value={form.lieu_naissance} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label>N° CNI</label>
                    <input name="num_cni" value={form.num_cni} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label>N° Carte Électeur</label>
                    <input name="num_carte_electeur" value={form.num_carte_electeur} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label>Lieu de Vote</label>
                    <input name="lieu_vote" value={form.lieu_vote} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label>Bureau de Vote</label>
                    <input name="bureau_vote" value={form.bureau_vote} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label>Téléphone</label>
                    <input name="telephone_1" value={form.telephone_1} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label>Quartier</label>
                    <input name="quartier" value={form.quartier} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label>Section</label>
                    <select name="section" value={form.section} onChange={handleChange}>
                      <option value="">— Sélectionnez —</option>
                      {sections.map(s => (
                        <option key={s.code_section} value={s.code_section}>{s.nom_section}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Cellule</label>
                    <select name="cellule" value={form.cellule} onChange={handleChange}>
                      <option value="">— Sélectionnez —</option>
                      {formCellules.map(c => (
                        <option key={c.code_cellule} value={c.code_cellule}>{c.nom_cellule}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Profession</label>
                    <input name="profession" value={form.profession} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label>Date d'Adhésion</label>
                    <input type="date" name="date_adhesion" value={form.date_adhesion} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label>Responsable Recensement</label>
                    <input name="responsable_recensement" value={form.responsable_recensement} onChange={handleChange} />
                  </div>
                  <div className="input-group input-group-full">
                    <label>Observations</label>
                    <textarea name="observations" value={form.observations} onChange={handleChange} rows="3" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : (editingMilitant ? 'Mettre à jour' : 'Enregistrer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailMilitant && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal modal-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👤 Fiche du Militant</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <DetailItem label="Code" value={detailMilitant.code_militant} />
                <DetailItem label="Nom" value={detailMilitant.nom} />
                <DetailItem label="Prénom(s)" value={detailMilitant.prenoms} />
                <DetailItem label="Sexe" value={detailMilitant.sexe} />
                <DetailItem label="Date de Naissance" value={detailMilitant.date_naissance} />
                <DetailItem label="Lieu de Naissance" value={detailMilitant.lieu_naissance} />
                <DetailItem label="N° CNI" value={detailMilitant.num_cni} />
                <DetailItem label="N° Carte Électeur" value={detailMilitant.num_carte_electeur} />
                <DetailItem label="Lieu de Vote" value={detailMilitant.lieu_vote} />
                <DetailItem label="Bureau de Vote" value={detailMilitant.bureau_vote} />
                <DetailItem label="Téléphone" value={detailMilitant.telephone_1} />
                <DetailItem label="Quartier" value={detailMilitant.quartier} />
                <DetailItem label="Section" value={detailMilitant.section_nom} />
                <DetailItem label="Cellule" value={detailMilitant.cellule_nom} />
                <DetailItem label="Profession" value={detailMilitant.profession} />
                <DetailItem label="Date d'Adhésion" value={detailMilitant.date_adhesion} />
                <DetailItem label="Resp. Recensement" value={detailMilitant.responsable_recensement} />
                <DetailItem label="Observations" value={detailMilitant.observations} full />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowDetailModal(false)}>Fermer</button>
              <button className="btn btn-primary" onClick={() => { setShowDetailModal(false); openEdit(detailMilitant); }}>
                ✏️ Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, full }) {
  return (
    <div className={`detail-item ${full ? 'detail-item-full' : ''}`}>
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || '—'}</span>
    </div>
  );
}
