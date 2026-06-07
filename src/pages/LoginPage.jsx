import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', form);
      const token =
        response.data?.token ||
        response.data?.access_token ||
        response.data?.data?.token;

      if (!token) {
        throw new Error('Giriş başarılı fakat token bilgisi alınamadı.');
      }

      localStorage.setItem('pos_token', token);
      navigate('/pos', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Kullanıcı adı veya şifre hatalı.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-heading">
          <span className="brand-mark large">HS</span>
          <div>
            <span className="eyebrow">Market POS</span>
            <h1>Hızlı Satış</h1>
            <p>Yetkili kullanıcı girişi</p>
          </div>
        </div>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Kullanıcı Adı
            <input
              autoFocus
              name="username"
              required
              value={form.username}
              onChange={handleChange}
              placeholder="admin"
            />
          </label>

          <label>
            Şifre
            <input
              name="password"
              required
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </label>

          <button className="complete-sale-button" disabled={loading} type="submit">
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </section>
    </main>
  );
}
