import { useState, useEffect } from 'react';
import { Download, Smartphone, X, ChevronRight } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Si ya está instalada (modo standalone), no mostrar nada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }
    // Si el usuario ya descartó el banner hoy, no molestar
    const dismissed = localStorage.getItem('install-dismissed');
    if (dismissed) return;

    // Detectar iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      // En iOS no hay evento nativo, mostramos instrucciones manuales
      setTimeout(() => setShowBanner(true), 3000);
    } else {
      // Android/Chrome: capturar el evento nativo de instalación
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setTimeout(() => setShowBanner(true), 2000);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('install-dismissed', 'true');
  };

  if (!showBanner || installed) return null;

  return (
    <>
      {/* Overlay oscuro */}
      <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" onClick={handleDismiss} />

      {/* Modal de instalación */}
      <div className="fixed bottom-0 left-0 right-0 z-[101] p-4 animate-in slide-in-from-bottom duration-300">
        <div className="bg-gradient-to-br from-premium-card to-premium-dark border border-premium-accent/30 rounded-2xl p-6 shadow-2xl max-w-md mx-auto">
          
          {/* Botón cerrar */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-premium-muted hover:text-premium-text p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Ícono y título */}
          <div className="flex items-center space-x-4 mb-5">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-premium-accent/40 shrink-0">
              <img src="/pwa-192x192.jpg" alt="App Icon" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-xs text-premium-accent font-semibold uppercase tracking-wider mb-1">
                📱 Instalá la app
              </p>
              <h2 className="text-xl font-bold text-premium-text leading-tight">
                Gestión Cheques
              </h2>
              <p className="text-sm text-premium-muted mt-0.5">
                Gratis · Sin Play Store
              </p>
            </div>
          </div>

          {/* Descripción */}
          <p className="text-premium-muted text-sm mb-5 leading-relaxed">
            Instalá esta app en tu celular para acceder de forma rápida, sin abrir el navegador, y que funcione aunque no tengas internet.
          </p>

          {/* Beneficios */}
          <div className="space-y-2 mb-6">
            {[
              'Acceso directo desde tu pantalla de inicio',
              'Funciona sin conexión a internet',
              'Tus datos guardados de forma segura en el celular',
            ].map((benefit) => (
              <div key={benefit} className="flex items-center space-x-3">
                <div className="w-5 h-5 rounded-full bg-premium-accent/20 flex items-center justify-center shrink-0">
                  <ChevronRight size={12} className="text-premium-accent" />
                </div>
                <p className="text-sm text-premium-text">{benefit}</p>
              </div>
            ))}
          </div>

          {/* Botón principal */}
          <button
            onClick={handleInstall}
            className="w-full flex items-center justify-center space-x-3 bg-premium-accent hover:bg-premium-accent/90 text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-premium-accent/30 text-base min-h-[56px]"
          >
            <Download size={20} />
            <span>{isIOS ? 'Ver cómo instalar' : 'Instalar en mi celular'}</span>
          </button>

          <p className="text-center text-xs text-premium-muted mt-3">
            Sin costo · No requiere tienda de apps
          </p>
        </div>
      </div>

      {/* Guía paso a paso para iOS */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[102] bg-black/80 flex items-end justify-center p-4">
          <div className="bg-premium-card border border-premium-muted/30 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-premium-text flex items-center space-x-2">
                <Smartphone size={20} className="text-premium-accent" />
                <span>Cómo instalar en iPhone</span>
              </h3>
              <button onClick={() => setShowIOSGuide(false)} className="text-premium-muted p-1">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { paso: '1', texto: 'Tocá el ícono de compartir (cuadrito con flecha) en la barra de abajo de Safari' },
                { paso: '2', texto: 'Deslizá hacia abajo en el menú y tocá "Añadir a pantalla de inicio"' },
                { paso: '3', texto: 'Tocá "Añadir" en la esquina superior derecha' },
                { paso: '4', texto: '¡Listo! El ícono apareció en tu pantalla de inicio' },
              ].map(({ paso, texto }) => (
                <div key={paso} className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-premium-accent flex items-center justify-center shrink-0 text-white font-bold text-sm">
                    {paso}
                  </div>
                  <p className="text-premium-text text-sm leading-relaxed pt-1">{texto}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setShowIOSGuide(false); setShowBanner(false); localStorage.setItem('install-dismissed', 'true'); }}
              className="w-full mt-6 bg-premium-accent text-white font-bold py-4 rounded-xl text-base"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
