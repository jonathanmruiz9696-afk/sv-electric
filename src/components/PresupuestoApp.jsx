import React, { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import logoSV from '../assets/images/sf-electrica.png';
import '../assets/styles/PresupuestoApp.css';

const CATEGORIAS_PREDETERMINADAS = [
  {
    nombre: "ARMADO DE TABLEROS",
    opciones: ["Servicios generales", "Bombas", "Departamentos", "Porteros", "Sala de máquinas"]
  },
  {
    nombre: "GABINETE DE MEDIDORES",
    opciones: ["26 Gabinetes Monofásicos", "1 Trifásico"]
  },
  {
    nombre: "ARMADO DE MONTANTE",
    opciones: ["Potencia (380v/220v/24v)", "TV", "Porteros", "Potencia de ascensor"]
  },
  {
    nombre: "PUESTA A TIERRA",
    opciones: ["3 Jabalinas", "Luces de emergencia", "Tomas de espacios comunes"]
  }
];

export default function PresupuestoApp() {
  const [modo, setModo] = useState('formulario');
  const pdfRef = useRef(null);

  const [cabecera, setCabecera] = useState({
    solicitadoPor: 'Alejandro Gonzalez',
    direccion: 'Beiro 2541',
    departamentos: '26',
    fecha: '2026-07-14',
    pedidoId: 'PED26 IDO Nº'
  });

  const [etapas] = useState([
    'Etapa 1: Colocación de cañerías y cajas sobre losas.',
    'Etapa 2: Mampostería (tableros, cajas y caños).',
    'Etapa 3: Cableado, armado de módulos y tableros.'
  ]);

  const [items, setItems] = useState([
    { id: 1, categoria: 'ARMADO DE TABLEROS', detalle: 'Tablero general, Bombas, Departamentos, Porteros, Sala de máquinas' },
    { id: 2, categoria: 'GABINETE DE MEDIDORES', detalle: '26 Gabinetes Monofásicos y 1 Trifásico' },
    { id: 3, categoria: 'ARMADO DE MONTANTE', detalle: 'Potencia (380v/220v/24v), TV, Porteros, Potencia de ascensor' },
    { id: 4, categoria: 'PUESTA A TIERRA', detalle: '3 Jabalinas, Luces de emergencia, Tomas de espacios comunes' }
  ]);

  const [personal, setPersonal] = useState({
    oficiales: 1,
    ayudantes: 2,
    tiempoEstimado: '18 meses'
  });

  const [cotizacion, setCotizacion] = useState({
    total: '65.000 u$s',
    condiciones: 'Inicio losas: adelanto del 20%. Inicio mampostería: pago semanal para el personal.'
  });

  const agregarItemVacio = () => {
    setItems([...items, { id: Date.now(), categoria: '', detalle: '' }]);
  };

  const agregarItemPredeterminado = (catNombre, detalleTexto) => {
    setItems([...items, { id: Date.now(), categoria: catNombre, detalle: detalleTexto }]);
  };

  const actualizarItem = (id, campo, valor) => {
    setItems(items.map(item => item.id === id ? { ...item, [campo]: valor } : item));
  };

  const eliminarItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const descargarPDF = async () => {
    const elemento = pdfRef.current;
    if (!elemento) return;

    const fileName = `Presupuesto_${cabecera.direccion.replace(/\s+/g, '_')}.pdf`;

    const opciones = {
      margin: [10, 10, 10, 10], // top, left, bottom, right en mm
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        width: 794 // Forzar resolución A4 estándar (210mm a 96dpi)
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Si la app está corriendo como App Nativa (Android / Capacitor)
    if (Capacitor.isNativePlatform()) {
      try {
        // 1. Generar el PDF como String Base64
        const pdfBase64 = await html2pdf().set(opciones).from(elemento).outputPdf('datauristring');
        const base64Data = pdfBase64.split(',')[1];

        // 2. Guardar temporalmente en el sistema de archivos del celular
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache
        });

        // 3. Abrir la ventana nativa de Android para Compartir / Guardar / Enviar
        await Share.share({
          title: 'Presupuesto SV Electricidad',
          text: `Presupuesto para ${cabecera.solicitadoPor} (${cabecera.direccion})`,
          url: savedFile.uri,
          dialogTitle: 'Compartir o guardar presupuesto'
        });
      } catch (error) {
        console.error('Error al generar/compartir PDF en Android:', error);
        alert('Ocurrió un error al procesar el archivo PDF en el celular.');
      }
    } else {
      // Comportamiento habitual en Navegador Web / Desktop
      html2pdf().set(opciones).from(elemento).save();
    }
  };

  return (
    <div className="app-container">
      
      {/* Top Navbar */}
      <div className="app-navbar">
        <div className="brand-title">
          <img src={logoSV} alt="SV Electricidad" className="navbar-logo" />
        </div>
        <div className="tab-switcher">
          <button 
            onClick={() => setModo('formulario')}
            className={`tab-btn ${modo === 'formulario' ? 'active' : ''}`}
          >
            Editar
          </button>
          <button 
            onClick={() => setModo('vista_previa')}
            className={`tab-btn ${modo === 'vista_previa' ? 'active' : ''}`}
          >
            Vista Previa
          </button>
        </div>
      </div>

      {/* MODO FORMULARIO */}
      {modo === 'formulario' && (
        <div className="form-section">
          
          <div className="card">
            <div className="card-title">1. Datos del Cliente / Obra</div>
            <div className="grid-2" style={{ marginBottom: '8px' }}>
              <div className="field-group">
                <label className="field-label">Solicitado por</label>
                <input 
                  type="text" 
                  value={cabecera.solicitadoPor}
                  onChange={(e) => setCabecera({...cabecera, solicitadoPor: e.target.value})}
                  className="input-field"
                />
              </div>
              <div className="field-group">
                <label className="field-label">Fecha</label>
                <input 
                  type="date" 
                  value={cabecera.fecha}
                  onChange={(e) => setCabecera({...cabecera, fecha: e.target.value})}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="field-group" style={{ gridColumn: 'span 2' }}>
                <label className="field-label">Dirección</label>
                <input 
                  type="text" 
                  value={cabecera.direccion}
                  onChange={(e) => setCabecera({...cabecera, direccion: e.target.value})}
                  className="input-field"
                />
              </div>
              <div className="field-group">
                <label className="field-label">Deptos</label>
                <input 
                  type="number" 
                  value={cabecera.departamentos}
                  onChange={(e) => setCabecera({...cabecera, departamentos: e.target.value})}
                  className="input-field"
                  style={{ textAlign: 'center' }}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="field-label" style={{ marginBottom: '6px' }}>Carga Rápida</div>
            <div className="shortcuts-scroll">
              {CATEGORIAS_PREDETERMINADAS.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => agregarItemPredeterminado(cat.nombre, cat.opciones.join(", "))}
                  className="btn-shortcut"
                >
                  + {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div className="card-title" style={{ margin: 0 }}>2. Ítems del Presupuesto</div>
              <button onClick={agregarItemVacio} className="btn-add">+ Agregar Fila</button>
            </div>

            {items.map((item) => (
              <div key={item.id} className="item-box">
                <button onClick={() => eliminarItem(item.id)} className="btn-delete" title="Eliminar">
                  Eliminar
                </button>
                <div style={{ paddingRight: '60px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input 
                    type="text" 
                    placeholder="CATEGORÍA"
                    value={item.categoria}
                    onChange={(e) => actualizarItem(item.id, 'categoria', e.target.value)}
                    className="input-field"
                    style={{ fontWeight: 'bold', textTransform: 'uppercase' }}
                  />
                  <textarea 
                    rows="2"
                    placeholder="Detalles..."
                    value={item.detalle}
                    onChange={(e) => actualizarItem(item.id, 'detalle', e.target.value)}
                    className="textarea-field"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">3. Personal y Cotización</div>
            <div className="grid-3" style={{ marginBottom: '12px' }}>
              <div className="field-group">
                <label className="field-label">Oficiales</label>
                <input 
                  type="number" 
                  value={personal.oficiales}
                  onChange={(e) => setPersonal({...personal, oficiales: e.target.value})}
                  className="input-field"
                  style={{ textAlign: 'center' }}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Ayudantes</label>
                <input 
                  type="number" 
                  value={personal.ayudantes}
                  onChange={(e) => setPersonal({...personal, ayudantes: e.target.value})}
                  className="input-field"
                  style={{ textAlign: 'center' }}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Tiempo Est.</label>
                <input 
                  type="text" 
                  value={personal.tiempoEstimado}
                  onChange={(e) => setPersonal({...personal, tiempoEstimado: e.target.value})}
                  className="input-field"
                  style={{ textAlign: 'center' }}
                />
              </div>
            </div>

            <div className="field-group" style={{ marginBottom: '8px' }}>
              <label className="field-label">Total Presupuesto</label>
              <input 
                type="text" 
                value={cotizacion.total}
                onChange={(e) => setCotizacion({...cotizacion, total: e.target.value})}
                className="input-field"
                style={{ fontWeight: '800', color: '#047857', fontSize: '15px' }}
              />
            </div>

            <div className="field-group">
              <label className="field-label">Condiciones de Pago</label>
              <textarea 
                rows="2"
                value={cotizacion.condiciones}
                onChange={(e) => setCotizacion({...cotizacion, condiciones: e.target.value})}
                className="textarea-field"
              />
            </div>
          </div>

          <div className="bottom-bar">
            <button onClick={() => setModo('vista_previa')} className="btn-main">
              Ver Hoja de Presupuesto
            </button>
          </div>

        </div>
      )}

      {/* MODO VISTA PREVIA Y PDF */}
      {modo === 'vista_previa' && (
        <div className="pdf-preview-wrapper">
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}>
            <span style={{ color: '#64748b' }}>Vista previa en A4</span>
            <button onClick={() => setModo('formulario')} style={{ background: 'none', border: 'none', color: '#0369a1', fontWeight: 'bold', cursor: 'pointer' }}>
              Volver a editar
            </button>
          </div>

          <div ref={pdfRef} id="hoja-presupuesto" className="pdf-page">
            
            {/* ENCABEZADO DEL PDF */}
            <div className="pdf-header">
              <div>
                <img src={logoSV} alt="SV Electricidad" className="pdf-logo" />
                <p className="pdf-subtitle">PRESUPUESTO MANO DE OBRA</p>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>{cabecera.pedidoId}</span>
              </div>
              <div style={{ textAlign: 'right', paddingTop: '4px' }}>
                <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>FECHA</span>
                <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>{cabecera.fecha}</p>
              </div>
            </div>

            <div className="pdf-client-box">
              <div>
                <strong style={{ color: '#64748b' }}>SOLICITADO POR:</strong>
                <p style={{ margin: '2px 0 0 0', fontWeight: 'bold' }}>{cabecera.solicitadoPor}</p>
              </div>
              <div>
                <strong style={{ color: '#64748b' }}>DIRECCIÓN:</strong>
                <p style={{ margin: '2px 0 0 0', fontWeight: 'bold' }}>{cabecera.direccion} ({cabecera.departamentos} Deptos)</p>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#04448C', textTransform: 'uppercase', borderBottom: '1px solid #e0f2fe', paddingBottom: '4px', marginBottom: '6px' }}>
                Etapas de Trabajo
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '10px', color: '#334155' }}>
                {etapas.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>

            <div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#04448C', textTransform: 'uppercase', marginBottom: '6px' }}>
                Descripción de Tareas
              </div>
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th style={{ width: '35%' }}>CATEGORÍA</th>
                    <th>DETALLE DE TAREAS</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{item.categoria}</td>
                      <td style={{ color: '#475569' }}>{item.detalle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '16px' }}>
              <div>
                <strong>PERSONAL:</strong> {personal.oficiales} Oficial, {personal.ayudantes} Ayudantes
              </div>
              <div>
                <strong>TIEMPO ESTIMADO:</strong> {personal.tiempoEstimado}
              </div>
            </div>

            <div className="pdf-footer">
              <div style={{ maxWidth: '60%' }}>
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Condiciones de Pago</span>
                <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#475569' }}>{cotizacion.condiciones}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Total Presupuesto</span>
                <div className="pdf-total-amount">{cotizacion.total}</div>
              </div>
            </div>

          </div>

          <div className="bottom-bar" style={{ gap: '8px' }}>
            <button onClick={() => setModo('formulario')} className="btn-main" style={{ backgroundColor: '#64748b', flex: 1 }}>
              Volver
            </button>
            <button onClick={descargarPDF} className="btn-main btn-download" style={{ flex: 2 }}>
              Descargar PDF
            </button>
          </div>

        </div>
      )}

    </div>
  );
}