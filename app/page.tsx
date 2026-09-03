'use client';

import { useState, useEffect } from 'react';

// Vista previa en vivo de un tema: en vez de una foto estática recortada (que cortaba el
// nombre "Emma Elizabeth" a este tamaño tan chico), incrusta la MISMA invitación real que ve
// un invitado (?embed=true&tema=<id>, modo hecho a propósito para esto en administradorinvitamx
// -- ver su App.tsx) a su tamaño natural de celular, y la encoge con un transform:scale(). Así
// el texto siempre se ve como se diseñó (se ajusta de línea, nunca se corta), igual que las
// miniaturas de la landing (que incrustan ese mismo catálogo en vivo). pointerEvents:'none' deja
// que el clic pase a la tarjeta de afuera (el flujo de WhatsApp de este sitio sigue intacto).
const IFRAME_W = 354;
const IFRAME_H = 642;

function ThemePreview({ themeId, index }: { themeId: string; index: number }) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Carga escalonada (igual que el catálogo interno) para no disparar 12 iframes completos
    // de golpe -- cada uno carga la app entera de administradorinvitamx.
    const timer = setTimeout(() => setShouldRender(true), 150 + index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  if (!shouldRender) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Cargando...</span>
      </div>
    );
  }

  return (
    <iframe
      src={`https://administradorinvitamx.vercel.app/?embed=true&tema=${themeId}`}
      title={`Vista previa ${themeId}`}
      style={{
        width: `${IFRAME_W}px`,
        height: `${IFRAME_H}px`,
        border: 0,
        transform: 'scale(0.4237)',
        transformOrigin: 'top left',
        pointerEvents: 'none',
      }}
    />
  );
}

export default function Catalogo() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const themes = [
    { id: 'dorado-clasico', nombre: 'Dorado Clásico ✨', primary: '#D4AF37', dark: '#2A2415' },
    { id: 'mariposas', nombre: 'Vuelo de Mariposas 🦋', primary: '#E0B0FF', dark: '#2D1D3A' },
    { id: 'floral-acuarela', nombre: 'Floral Acuarela 💐', primary: '#E2879F', dark: '#401B24' },
    { id: 'celestial', nombre: 'Místico Celestial 🌙', primary: '#87CEEB', dark: '#080C14' },
    { id: 'botanico', nombre: 'Eucalipto Botánico 🌿', primary: '#556B2F', dark: '#1C281F' },
    { id: 'glam-rose', nombre: 'Glam Rose Oro 💖', primary: '#B76E79', dark: '#3B2226' },
    { id: 'boho-chic', nombre: 'Rustique Boho Chic 🌾', primary: '#C27A5B', dark: '#361D13' },
    { id: 'princesa-elegante', nombre: 'Princesa Elegante 👑', primary: '#1A365D', dark: '#0F172A' },
    { id: 'marmol-oro', nombre: 'Mármol & Oro Geométrico 📐', primary: '#C59B27', dark: '#1A1A1A' },
    { id: 'neon', nombre: 'Ciber Cyber Neon ⚡', primary: '#FF007F', dark: '#05050B' },
    { id: 'coquette-pink', nombre: 'XV Coquette Listones Rose 🎀', primary: '#E45D8C', dark: '#472F35' },
    { id: 'coquette-luxe', nombre: 'XV Coquette Luxe 💎', primary: '#C66B8F', dark: '#1A1A1A' },
  ];

  const handleSelectTheme = (themeName: string) => {
    setSelectedTheme(themeName);
    const text = `Hola, me encanta el tema "${themeName}" de tu catálogo. ¿Cuáles son los planes disponibles?`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-light)', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '40px', color: 'var(--primary-dark)', marginBottom: '1rem' }}>
            ✨ Catálogo de Temas XV
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Explora nuestros 12 temas elegantes. Selecciona el que más te guste y cuéntanos por WhatsApp.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '28px',
          marginBottom: '3rem',
        }}>
          {themes.map((theme, i) => (
            <div
              key={theme.id}
              onClick={() => handleSelectTheme(theme.nombre)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '150px',
                  height: '300px',
                  background: theme.dark,
                  borderRadius: '28px',
                  border: selectedTheme === theme.nombre
                    ? `3px solid white`
                    : `3px solid ${theme.primary}`,
                  outline: selectedTheme === theme.nombre ? `3px solid ${theme.primary}` : 'none',
                  padding: '10px',
                  boxShadow: selectedTheme === theme.nombre
                    ? '0 16px 32px rgba(0,0,0,0.25)'
                    : '0 12px 24px rgba(0,0,0,0.15)',
                  transform: selectedTheme === theme.nombre ? 'scale(1.05)' : 'scale(1)',
                  position: 'relative',
                  transition: 'all 0.3s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-6px)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = selectedTheme === theme.nombre ? 'scale(1.05)' : 'translateY(0)')}
              >
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '44px',
                  height: '12px',
                  background: theme.dark,
                  border: `2px solid ${theme.primary}`,
                  borderRadius: '8px',
                  zIndex: 2,
                }} />
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.dark} 100%)`,
                }}>
                  <ThemePreview themeId={theme.id} index={i} />
                </div>
              </div>
              <h3 style={{
                marginTop: '0.75rem',
                fontSize: '14px',
                fontWeight: 500,
                textAlign: 'center',
                color: 'var(--text-primary)',
              }}>
                {theme.nombre}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Click para seleccionar</p>
            </div>
          ))}
        </div>

        <div style={{
          background: 'var(--bg-white)',
          borderRadius: '12px',
          padding: '2rem',
          border: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '24px', color: 'var(--primary-dark)', marginBottom: '1rem' }}>
            ¿No sabes cuál elegir?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Cuéntanos cuál te gustó más y nos encargamos de personalizar tu invitación XV perfecta.
          </p>
          <button
            onClick={() => {
              const text = 'Hola, necesito ayuda para elegir el tema perfecto para mi invitación XV.';
              const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
              window.open(url, '_blank');
            }}
            style={{
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 500,
              transition: 'all 0.3s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Asesoría Personalizada 💬
          </button>
        </div>
      </div>
    </main>
  );
}
