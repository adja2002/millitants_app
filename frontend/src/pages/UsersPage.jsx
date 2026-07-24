import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    role: 'SAISISSEUR',
    is_active: true
  });

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users/');
      setUsers(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ username: '', password: '', email: '', role: 'SAISISSEUR', is_active: true });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      username: u.username,
      password: '', // On ne pré-remplit pas le mot de passe
      email: u.email || '',
      role: u.role || 'SAISISSEUR',
      is_active: u.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing && !payload.password) {
        delete payload.password; // Ne pas envoyer le mot de passe si vide lors de l'édition
      }

      if (editing) {
        await API.put(`/users/${editing.id}/`, payload);
      } else {
        await API.post('/users/', payload);
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Supprimer définitivement l'utilisateur "${u.username}" ?`)) return;
    try {
      await API.delete(`/users/${u.id}/`);
      loadUsers();
    } catch (err) {
      alert('Erreur lors de la suppression.');
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  if (user?.role !== 'ADMIN') {
    return <div className="page-loading"><h2>Accès refusé.</h2></div>;
  }

  return (
    <div className="users-page">
      <div className="toolbar">
        <div className="toolbar-left">
          <span className="result-count">{users.length} utilisateur(s)</span>
        </div>
        <button className="btn btn-primary btn-add" onClick={openAdd}>
          + Ajouter un utilisateur
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
                  <th>Nom d'utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.email || '—'}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-primary' : 'badge-info'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-warning'}`}>
                        {u.is_active ? 'Actif' : 'Bloqué'}
                      </span>
                    </td>
                    <td>
                      {u.id !== user.id && (
                        <div className="action-btns">
                          <button className="btn-icon btn-edit" title="Modifier" onClick={() => openEdit(u)}>✏️</button>
                          <button className="btn-icon btn-delete" title="Supprimer" onClick={() => handleDelete(u)}>🗑️</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="empty-state">Aucun utilisateur trouvé</td></tr>
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
              <h2>{editing ? '✏️ Modifier l\'utilisateur' : '➕ Nouvel utilisateur'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-group">
                  <label>Nom d'utilisateur *</label>
                  <input name="username" value={form.username} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>Email</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>{editing ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}</label>
                  <input type="password" name="password" value={form.password} onChange={handleChange} required={!editing} />
                </div>
                <div className="input-group">
                  <label>Rôle *</label>
                  <select name="role" value={form.role} onChange={handleChange} required>
                    <option value="SAISISSEUR">Saisisseur</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>
                <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} style={{width: 'auto'}} />
                  <label style={{marginBottom: 0}}>Compte actif</label>
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
