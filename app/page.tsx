'use client';

import { useState } from 'react';

export default function Catalogo() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const themes = [
    { id: 'purple', name: 'Elegancia Morada', gradient: 'linear-gradient(135deg, #7F77DD 0%, #534AB7 100%)' },
    { id: 'teal', name: 'Verde Esmeralda', gradient: 'linear-gradient(135deg, #1D9E75 0%, #0F6E56 100%)' },
    { id: 'coral', name: 'Coral Sunset', gradient: 'linear-gradient(135deg, #D85A30 0%, #993C1D 100%)' },
    { id: 'pink', name: 'Rosa Romántico', gradient: 'linear-gradient(135deg, #D4537E 0%, #993556 100%)' },
    { id: 'blue', name: 'Azul Profundo', gradient: 'linear-gradient(135deg, #378ADD 0%, #185FA5 100%)' },
    { id: 'mint', name: 'Verde Menta', gradient: 'linear-gradient(135deg, #639922 0%, #3B6D11 100%)' },
    { id: 'gold', name: 'Dorado Elegante', gradient: 'linear-gradient(135deg, #BA7517 0%, #854F0B 100%)' },
    { id: 'red', name: 'Rojo Pasión', gradient: 'linear-gradient(135deg, #E24B4A 0%, #A32D2D 100%)' },
    { id: 'gray', name: 'Gris Moderno', gradient: 'linear-gradient(135deg, #888780 0%, #5F5E5A 100%)' },
    { id: 'amber', name: 'Ámbar Cálido', gradient: 'linear-gradient(135deg, #EF9F27 0%, #BA7517 100%)' },
    { id: 'sky', name: 'Cielo Claro', gradient: 'linear-gradient(135deg, #85B7EB 0%, #378ADD 100%)' },
    { id: 'spring', name: 'Primavera Verde', gradient: 'linear-gradient(135deg, #97C459 0%, #639922 100%)' },
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '3rem',
        }}>
          {themes.map((theme) => (
            <div
              key={theme.id}
              onClick={() => handleSelectTheme(theme.name)}
              style={{
                background: theme.gradient,
                borderRadius: '12px',
                padding: '2rem',
                height: '240px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 500,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: selectedTheme === theme.name ? '3px solid white' : 'none',
                transform: selectedTheme === theme.name ? 'scale(1.05)' : 'scale(1)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = selectedTheme === theme.name ? 'scale(1.05)' : 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '0.5rem' }}>🎨</div>
              <h3 style={{ fontSize: '18px', marginBottom: '0.5rem' }}>{theme.name}</h3>
              <p style={{ fontSize: '12px', opacity: 0.9 }}>Click para seleccionar</p>
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
