import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useCarreiraSession } from '@/hooks/useCarreiraSession';
import { JornadaEsportiva } from '@/components/jornada/JornadaEsportiva';

export default function JornadaEsportivaPage() {
  const { sessionUserId, loading } = useCarreiraSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !sessionUserId) navigate('/login', { replace: true });
  }, [loading, sessionUserId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sessionUserId) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 px-2 py-1 rounded"
            aria-label="Voltar"
          >
            ← Voltar
          </button>
          <h1 className="font-semibold text-gray-900 text-lg">Jornada Esportiva</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <JornadaEsportiva crianca_id={sessionUserId} />
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-gray-400">
        Carreira ID — Jornada Esportiva
      </footer>
    </div>
  );
}
