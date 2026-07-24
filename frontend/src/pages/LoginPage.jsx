import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Identifiants incorrects. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="brand-hero">
            <div className="brand-badge">🗳️ SGM</div>
            <h1>Notre Candidat,<br />Notre Avenir</h1>
            <p>Rejoignez la plateforme de gestion centralisée de nos militants et sympathisants.</p>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-icon">👥</span>
                <span className="hero-stat-label">Militants</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-icon">🏛️</span>
                <span className="hero-stat-label">Sections</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-icon">🏢</span>
                <span className="hero-stat-label">Cellules</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-box">
            <h2>Connexion</h2>
            <p className="subtitle">Veuillez vous identifier pour accéder au système.</p>

            {error && (
              <div className="alert alert-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="username">Nom d'utilisateur</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: admin"
                  required
                  autoFocus
                />
              </div>
              <div className="input-group">
                <label htmlFor="password">Mot de passe</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Connexion en cours...
                  </>
                ) : (
                  'Se Connecter'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
