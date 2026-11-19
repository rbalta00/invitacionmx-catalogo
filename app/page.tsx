'use client';

import { useState, useEffect, useRef } from 'react';

// Vista previa en vivo de un tema: en vez de una foto estática recortada (que cortaba el
// nombre "Emma Elizabeth" a este tamaño tan chico), incrusta la MISMA invitación real que ve
// un invitado (?embed=true&tema=<id>, modo hecho a propósito para esto en administradorinvitamx
// -- ver su App.tsx) a su tamaño natural de celular, y la encoge con un transform:scale(). Así
// el texto siempre se ve como se diseñó (se ajusta de línea, nunca se corta), igual que las
// miniaturas de la landing (que incrustan ese mismo catálogo en vivo). pointerEvents:'none' deja
// que el clic pase a la tarjeta de afuera (el flujo de WhatsApp de este sitio sigue intacto).
//
// La escala se MIDE en vivo contra el contenedor real (con ResizeObserver) en vez de asumir un
// número fijo: el marco del teléfono (padding + borde) deja menos ancho útil que los 150px
// nominales de la tarjeta -- con una escala fija calculada sobre 150px, el iframe salía más
// ancho que su contenedor y overflow:hidden lo recortaba del lado derecho (se veía "descentrado"
// y con el nombre cortado, justo lo que se estaba intentando arreglar).
const IFRAME_W = 354;
const IFRAME_H = 642;

// Cola de concurrencia compartida por todas las miniaturas de la página: cada vista previa
// carga la app ENTERA de administradorinvitamx (React + Google Fonts + generar el HTML), y
// probado en vivo, una sola tarda ~5.6s -- pero varias al mismo tiempo compiten tanto por CPU
// y red que se disparan entre sí a 60-90+ segundos (algunas parecían quedarse pegadas). No
// basta con "solo cargar lo visible" (siguen siendo ~6 a la vez); hace falta un límite real de
// cuántas cargan AL MISMO TIEMPO, con las demás esperando su turno en cola.
const MAX_CARGAS_SIMULTANEAS = 2;
let cargasActivas = 0;
const colaDeEspera: Array<() => void> = [];

function pedirTurno(): Promise<void> {
  if (cargasActivas < MAX_CARGAS_SIMULTANEAS) {
    cargasActivas++;
    return Promise.resolve();
  }
  return new Promise((resolve) => colaDeEspera.push(resolve));
}

function liberarTurno() {
  const siguiente = colaDeEspera.shift();
  if (siguiente) {
    siguiente(); // el cupo pasa directo al siguiente en la fila, cargasActivas no cambia
  } else {
    cargasActivas = Math.max(0, cargasActivas - 1);
  }
}

function ThemePreview({ themeId, index }: { themeId: string; index: number }) {
  const [shouldRender, setShouldRender] = useState(false);
  const [scale, setScale] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // true entre el momento en que se toma un turno de la cola y el momento en que se libera --
  // se checa Y se apaga en el mismo paso en los dos lugares que pueden liberarlo (el timer
  // normal, o el cleanup si el componente se desmonta antes), para nunca liberar dos veces el
  // mismo turno por accidente.
  const turnoActivo = useRef(false);

  const soltarTurnoUnaVez = () => {
    if (turnoActivo.current) {
      turnoActivo.current = false;
      liberarTurno();
    }
  };

  useEffect(() => {
    // Solo pide su turno cuando la tarjeta está por entrar en pantalla (rootMargin la
    // adelanta un poco) -- las que están abajo del todo ni siquiera hacen fila hasta que se
    // acerca el scroll.
    const el = containerRef.current;
    if (!el) return;
    let cancelado = false;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        io.disconnect();
        pedirTurno().then(() => {
          if (cancelado) { liberarTurno(); return; }
          turnoActivo.current = true;
          setShouldRender(true);
        });
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => {
      cancelado = true;
      io.disconnect();
      soltarTurnoUnaVez();
    };
  }, [index]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const medir = () => setScale(el.clientWidth / IFRAME_W);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldRender) return;
    // Libera el turno un rato después de empezar a cargar, no cuando el iframe dispara "load"
    // -- ese evento del navegador llega apenas termina el HTML inicial de administradorinvitamx,
    // MUCHO antes de que su propio React monte, genere la invitación y la reemplace con
    // document.write (que es lo realmente pesado). Medido en vivo y aislado, una vista previa
    // completa tarda ~5.6s -- 6.5s de margen deja que termine antes de ceder el turno a la
    // siguiente en la fila.
    const timer = setTimeout(soltarTurnoUnaVez, 6500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRender]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {!shouldRender || scale === 0 ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Cargando...</span>
        </div>
      ) : (
        <iframe
          src={`https://administradorinvitamx.vercel.app/?embed=true&tema=${themeId}`}
          title={`Vista previa ${themeId}`}
          style={{
            width: `${IFRAME_W}px`,
            height: `${IFRAME_H}px`,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

// Las 5 animaciones de apertura reales del generador (ver tipoAperturaPorDefectoDelTema en
// administradorinvitamx/src/App.tsx) -- ninguna se veía en ningún lado del catálogo hasta ahora
// (las tarjetas de tema excluyen la pantalla de apertura a propósito, ver ThemePreview arriba).
const APERTURAS: { id: string; nombre: string }[] = [
  { id: 'sobre', nombre: 'Sobre con sello de cera' },
  { id: 'cortina', nombre: 'Cortina de gala' },
  { id: 'tarjeta', nombre: 'Tarjeta' },
  { id: 'puertas', nombre: 'Puertas de Gala' },
  { id: 'destellos', nombre: 'Destellos' },
];

// Tema fijo para este demo -- la sección es sobre las APERTURAS, no sobre temas, así que no
// hace falta dejar elegir tema aquí también (las tarjetas de arriba ya cubren eso).
const TEMA_DEMO_APERTURAS = 'dorado-clasico';

// Mismo tratamiento visual (marco/escala) que ThemePreview, pero para un solo demo a la vez --
// key={apertura} en el call site fuerza que React desmonte y vuelva a montar este componente
// (y por lo tanto recargue el iframe desde cero) cada vez que se cambia de pestaña.
function AperturaDemoIframe({ apertura }: { apertura: string }) {
  const [scale, setScale] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const medir = () => setScale(el.clientWidth / IFRAME_W);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {scale === 0 ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Cargando...</span>
        </div>
      ) : (
        <iframe
          src={`https://administradorinvitamx.vercel.app/?embed=true&tema=${TEMA_DEMO_APERTURAS}&apertura=${apertura}`}
          title={`Apertura ${apertura}`}
          style={{
            width: `${IFRAME_W}px`,
            height: `${IFRAME_H}px`,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      )}
    </div>
  );
}

function AperturaDemoSection() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const [apertura, setApertura] = useState('puertas');
  const aperturaActual = APERTURAS.find((a) => a.id === apertura) ?? APERTURAS[3];

  const handleWhatsApp = () => {
    const text = `Hola, quiero mi muestra gratis con la apertura de ${aperturaActual.nombre}, ¿qué datos te mando?`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{
      background: 'var(--bg-white)',
      borderRadius: '12px',
      padding: '2.5rem 2rem',
      border: '1px solid var(--border)',
      textAlign: 'center',
      marginBottom: '3rem',
    }}>
      <h2 style={{ fontSize: '24px', color: 'var(--primary-dark)', marginBottom: '0.75rem' }}>
        Mira cómo se abre tu invitación
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
        Tu invitación puede abrir de 5 formas distintas. Toca una y pruébala aquí mismo:
      </p>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '2rem',
      }}>
        {APERTURAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setApertura(a.id)}
            style={{
              background: apertura === a.id ? 'var(--primary)' : 'var(--bg-light)',
              color: apertura === a.id ? 'white' : 'var(--text-primary)',
              border: `1px solid ${apertura === a.id ? 'var(--primary)' : 'var(--border)'}`,
              padding: '8px 16px',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {a.nombre}
          </button>
        ))}
      </div>

      <div style={{
        width: '220px',
        aspectRatio: `${IFRAME_W} / ${IFRAME_H}`,
        margin: '0 auto 1.5rem',
        borderRadius: '28px',
        border: '3px solid var(--primary)',
        background: '#1a1a1a',
        padding: '10px',
        boxShadow: '0 16px 32px rgba(0,0,0,0.2)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '44px',
          height: '12px',
          background: '#1a1a1a',
          border: '2px solid var(--primary)',
          borderRadius: '8px',
          zIndex: 2,
        }} />
        <div style={{ width: '100%', height: '100%', borderRadius: '18px', overflow: 'hidden' }}>
          <AperturaDemoIframe key={apertura} apertura={apertura} />
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Las 5 van incluidas en todos los planes. En tu muestra gratis te la dejamos con la que más te guste.
      </p>

      <button
        onClick={handleWhatsApp}
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
        Quiero mi muestra gratis
      </button>
    </div>
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
    { id: 'aurora-boreal', nombre: 'Aurora Boreal 🌌', primary: '#00D9FF', dark: '#050f2d' },
    { id: 'vino-elegante', nombre: 'Vino Elegante 🍷', primary: '#7B1E3A', dark: '#2A0E14' },
  ];

  const handleSelectTheme = (themeName: string) => {
    setSelectedTheme(themeName);
    const text = `Hola, me encanta el tema "${themeName}" de tu catálogo. Quiero mi muestra gratis, ¿qué datos te mando?`;
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
            Explora nuestros 14 temas elegantes. Selecciona el que más te guste y cuéntanos por WhatsApp.
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
                  // Antes: height:'100%' estiraba esta caja a los 274px completos del marco,
                  // pero el iframe escalado (que respeta la proporción real 354:642 de la
                  // invitación) solo llega a ~225px de alto -- el sobrante de abajo se veía
                  // como un bloque de color liso (el gradiente de respaldo), no el fondo real
                  // del tema. Usando la MISMA proporción aquí, la caja mide justo lo que el
                  // iframe realmente ocupa -- sin hueco, sin color de relleno de más.
                  aspectRatio: `${IFRAME_W} / ${IFRAME_H}`,
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

        <AperturaDemoSection />

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
