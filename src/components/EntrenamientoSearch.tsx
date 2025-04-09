import { useState, FormEvent, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Entrenamiento } from '../App';
import { cambiarEstadoPagoMultiple } from '../services/firestore';
import { calcularPrecio, formatearPrecioCLP } from '../utils/priceCalculator';
import '../styles/EntrenamientoSearch.css';

/**
 * Convierte una cadena de fecha en formato "YYYY-MM-DD" a un objeto Date
 * preservando correctamente la zona horaria local
 */
const stringToLocalDate = (dateString: string): Date => {
  const parts = dateString.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

interface EntrenamientoSearchProps {
  entrenamientos: Entrenamiento[];
  onClose: () => void;
  onDataChange?: () => void; // Para refrescar datos después de actualizaciones masivas
}

const EntrenamientoSearch = ({ entrenamientos, onClose, onDataChange }: EntrenamientoSearchProps) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [fechaInicio, setFechaInicio] = useState<string>(
    firstDayOfMonth.toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState<string>(
    today.toISOString().split('T')[0]
  );
  const [filtroPago, setFiltroPago] = useState<string>('todos');
  const [resultados, setResultados] = useState<Entrenamiento[]>([]);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [procesando, setProcesando] = useState(false);
  
  // Estado para el modal de mensaje de cobro
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensajeCobro, setMensajeCobro] = useState('');
  const mensajeRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const filtrados = entrenamientos.filter(entrenamiento => {
      const fechaEnt = format(entrenamiento.fecha, 'yyyy-MM-dd');
      const cumpleFechaInicio = fechaEnt >= fechaInicio;
      const cumpleFechaFin = fechaEnt <= fechaFin;
      
      let cumplePago = true;
      if (filtroPago === 'pagados') {
        cumplePago = entrenamiento.pagado;
      } else if (filtroPago === 'pendientes') {
        cumplePago = !entrenamiento.pagado;
      }
      
      return cumpleFechaInicio && cumpleFechaFin && cumplePago;
    });
    
    // Ordenar por fecha, más reciente primero
    const ordenados = [...filtrados].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
    
    setResultados(ordenados);
    setBusquedaRealizada(true);
  };

  // Función para marcar todos los entrenamientos filtrados como pagados
  const handleMarcarTodosPagados = async () => {
    if (resultados.length === 0) return;
    
    // Filtramos solo los que no están pagados aún
    const pendientesPago = resultados.filter(e => !e.pagado);
    
    if (pendientesPago.length === 0) {
      alert('Todos los entrenamientos ya están marcados como pagados.');
      return;
    }
    
    if (confirm(`¿Estás seguro de marcar como pagados ${pendientesPago.length} entrenamientos?`)) {
      setProcesando(true);
      try {
        // Extraer solo los IDs de los entrenamientos pendientes
        const ids = pendientesPago.map(e => e.id);
        
        // Llamar a la función para actualizar múltiples documentos
        await cambiarEstadoPagoMultiple(ids, true);
        
        // Actualizar la UI
        setResultados(prevResultados => 
          prevResultados.map(e => ({...e, pagado: e.pagado || ids.includes(e.id)}))
        );
        
        // Notificar al componente padre para refrescar los datos
        if (onDataChange) onDataChange();
        
        alert(`Se han marcado ${pendientesPago.length} entrenamientos como pagados.`);
      } catch (error) {
        console.error('Error al marcar entrenamientos como pagados:', error);
        alert('Ocurrió un error al actualizar los entrenamientos.');
      } finally {
        setProcesando(false);
      }
    }
  };

  // Calcular totales
  const totalEntrenamientos = resultados.length;
  const totalPagados = resultados.filter(e => e.pagado).length;
  const totalPendientes = totalEntrenamientos - totalPagados;

  // Calcular totales de tiempo
  const horasTotales = resultados.reduce((acc, curr) => acc + curr.duracion, 0) / 60;
  const horasPagadas = resultados.filter(e => e.pagado).reduce((acc, curr) => acc + curr.duracion, 0) / 60;
  const horasPendientes = resultados.filter(e => !e.pagado).reduce((acc, curr) => acc + curr.duracion, 0) / 60;

  // Calcular montos monetarios
  const montoTotal = resultados.reduce((acc, curr) => 
    acc + calcularPrecio(curr.duracion, curr.incluyeArriendo, curr.valorArriendo), 0);
  
  const montoPagado = resultados
    .filter(e => e.pagado)
    .reduce((acc, curr) => 
      acc + calcularPrecio(curr.duracion, curr.incluyeArriendo, curr.valorArriendo), 0);
  
  const montoPendiente = montoTotal - montoPagado;
  
  // Función para generar el mensaje de cobro
  const generarMensajeCobro = () => {
    // Filtrar solo entrenamientos pendientes
    const pendientesPago = resultados.filter(e => !e.pagado);
    
    if (pendientesPago.length === 0) {
      alert('No hay entrenamientos pendientes por cobrar en este período.');
      return;
    }
    
    // Usar la función auxiliar para convertir fechas
    const fechaInicioObj = stringToLocalDate(fechaInicio);
    const fechaFinObj = stringToLocalDate(fechaFin);
    
    console.log('Fecha inicio string:', fechaInicio);
    console.log('Fecha fin string:', fechaFin);
    console.log('Fecha inicio objeto:', fechaInicioObj);
    console.log('Fecha fin objeto:', fechaFinObj);
    
    // Obtener fechas formateadas para el título
    const fechaInicioFormateada = format(fechaInicioObj, 'd \'de\' MMMM', { locale: es });
    const fechaFinFormateada = format(fechaFinObj, 'd \'de\' MMMM', { locale: es });
    
    console.log('Fecha inicio formateada:', fechaInicioFormateada);
    console.log('Fecha fin formateada:', fechaFinFormateada);
    
    // Ordenar por fecha, más antiguo primero
    const pendientesOrdenados = [...pendientesPago].sort((a, b) => 
      a.fecha.getTime() - b.fecha.getTime()
    );
    
    // Generar mensaje
    let mensaje = `${fechaInicioFormateada} - ${fechaFinFormateada}\n`;
    
    // Para cada entrenamiento, generar una línea en el mensaje
    pendientesOrdenados.forEach(entrenamiento => {
      // Formatear correctamente el día de la semana y la fecha
      const diaSemana = format(entrenamiento.fecha, 'EEEE', { locale: es });
      const diaFormateado = format(entrenamiento.fecha, 'd/MM', { locale: es });
      
      // Capitalizar primera letra del día
      const diaSemanaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
      
      const precio = calcularPrecio(
        entrenamiento.duracion, 
        entrenamiento.incluyeArriendo, 
        entrenamiento.valorArriendo
      );
      
      let lineaMensaje = `* ${diaSemanaCapitalizado} ${diaFormateado}: ${entrenamiento.tipo} ${formatearPrecioCLP(precio)}`;
      
      // Agregar nota sobre el arriendo si corresponde
      if (entrenamiento.incluyeArriendo && entrenamiento.valorArriendo && entrenamiento.valorArriendo > 0) {
        lineaMensaje += ` (incluye arriendo de ${formatearPrecioCLP(entrenamiento.valorArriendo)})`;
      }
      
      mensaje += lineaMensaje + '\n';
    });
    
    mensaje += `\nTotal a depositar: ${formatearPrecioCLP(montoPendiente)}`;
    
    setMensajeCobro(mensaje);
    setMostrarModal(true);
  };
  
  // Función para copiar el mensaje al portapapeles
  const copiarAlPortapapeles = () => {
    if (mensajeRef.current) {
      mensajeRef.current.select();
      document.execCommand('copy');
      alert('Mensaje copiado al portapapeles');
    }
  };

  return (
    <div className="entrenamiento-search">
      <h3>Buscar Entrenamientos</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fechaInicio">Fecha Inicio</label>
            <input
              type="date"
              id="fechaInicio"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="fechaFin">Fecha Fin</label>
            <input
              type="date"
              id="fechaFin"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="filtroPago">Estado de Pago</label>
          <select
            id="filtroPago"
            value={filtroPago}
            onChange={(e) => setFiltroPago(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="pagados">Pagados</option>
            <option value="pendientes">Pendientes</option>
          </select>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Buscar
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Volver
          </button>
        </div>
      </form>
      
      {busquedaRealizada && (
        <div className="search-results">
          <div className="result-summary">
            <h4>Resumen</h4>
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-title">Total</div>
                <div className="summary-value">{totalEntrenamientos}</div>
                <div className="summary-subtitle">entrenamientos</div>
              </div>
              <div className="summary-card paid">
                <div className="summary-title">Pagados</div>
                <div className="summary-value">{totalPagados}</div>
                <div className="summary-subtitle">entrenamientos</div>
              </div>
              <div className="summary-card pending">
                <div className="summary-title">Pendientes</div>
                <div className="summary-value">{totalPendientes}</div>
                <div className="summary-subtitle">entrenamientos</div>
              </div>
            </div>
            
            <div className="hours-summary">
              <div><strong>Horas totales:</strong> {horasTotales.toFixed(1)}h</div>
              <div><strong>Horas pagadas:</strong> {horasPagadas.toFixed(1)}h</div>
              <div><strong>Horas pendientes:</strong> {horasPendientes.toFixed(1)}h</div>
            </div>
            
            <div className="money-summary">
              <div><strong>Monto total:</strong> {formatearPrecioCLP(montoTotal)}</div>
              <div><strong>Monto pagado:</strong> {formatearPrecioCLP(montoPagado)}</div>
              <div><strong>Monto pendiente:</strong> {formatearPrecioCLP(montoPendiente)}</div>
            </div>
            
            <div className="button-group">
              {totalPendientes > 0 && (
                <button 
                  className="btn-success mark-all-paid" 
                  onClick={handleMarcarTodosPagados}
                  disabled={procesando}
                >
                  {procesando ? 'Procesando...' : `Marcar todos como pagados (${totalPendientes}) - ${formatearPrecioCLP(montoPendiente)}`}
                </button>
              )}
              
              {totalPendientes > 0 && (
                <button 
                  className="btn-info generate-message" 
                  onClick={generarMensajeCobro}
                >
                  Generar MS de cobro
                </button>
              )}
            </div>
          </div>
          
          <h4>Resultados ({totalEntrenamientos})</h4>
          
          {resultados.length === 0 ? (
            <div className="no-results">
              No se encontraron entrenamientos con los criterios seleccionados.
            </div>
          ) : (
            <div className="results-list">
              {resultados.map(entrenamiento => (
                <div 
                  key={entrenamiento.id} 
                  className={`result-item ${entrenamiento.pagado ? 'paid' : 'pending'}`}
                >
                  <div className="result-date">
                    {format(entrenamiento.fecha, 'EEEE, d MMMM yyyy', { locale: es })}
                  </div>
                  <div className="result-details">
                    <div className="result-type">{entrenamiento.tipo}</div>
                    <div className="result-duration">{entrenamiento.duracion} min</div>
                    <div className={`result-status ${entrenamiento.pagado ? 'paid' : 'pending'}`}>
                      {entrenamiento.pagado ? 'Pagado' : 'Pendiente'}
                    </div>
                    <div className="result-price">
                      {formatearPrecioCLP(calcularPrecio(
                        entrenamiento.duracion, 
                        entrenamiento.incluyeArriendo, 
                        entrenamiento.valorArriendo
                      ))}
                      {entrenamiento.incluyeArriendo && entrenamiento.valorArriendo && entrenamiento.valorArriendo > 0 && (
                        <span className="arriendo-badge" title={`Incluye arriendo: ${formatearPrecioCLP(entrenamiento.valorArriendo)}`}>+</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Modal para el mensaje de cobro */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Mensaje de Cobro</h3>
            <p className="modal-subtitle">Copia este mensaje para enviarlo por WhatsApp</p>
            
            <textarea
              ref={mensajeRef}
              className="mensaje-cobro"
              value={mensajeCobro}
              readOnly
            />
            
            <div className="modal-actions">
              <button className="btn-primary" onClick={copiarAlPortapapeles}>
                Copiar mensaje
              </button>
              <button className="btn-danger" onClick={() => setMostrarModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntrenamientoSearch; 