import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Credenciales inválidas. Verifica tu correo y contraseña.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-premium-dark flex items-center justify-center p-4">
      <div className="bg-premium-card w-full max-w-md p-8 rounded-2xl shadow-xl border border-premium-muted/20">
        <div className="text-center mb-8">
          <div className="bg-premium-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="text-premium-accent" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-premium-text">Acceso Seguro</h1>
          <p className="text-premium-muted mt-2">Sistema de Gestión de Cheques</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-premium-muted mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              className="w-full bg-premium-dark border border-premium-muted/30 rounded-lg px-4 py-3 text-premium-text focus:outline-none focus:border-premium-accent focus:ring-1 focus:ring-premium-accent transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-premium-muted mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              className="w-full bg-premium-dark border border-premium-muted/30 rounded-lg px-4 py-3 text-premium-text focus:outline-none focus:border-premium-accent focus:ring-1 focus:ring-premium-accent transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-premium-danger/10 border border-premium-danger/20 text-premium-danger px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-premium-accent hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
