import { Entrenamiento } from '../App'
import { calcularPrecio, formatearPrecioCLP } from '../utils/priceCalculator';
import '../styles/EntrenamientoList.css'

interface EntrenamientoListProps {
  entrenamientos: Entrenamiento[];
  onSelect: (entrenamiento: Entrenamiento) => void;
  onTogglePago: (id: string) => void;
}

const EntrenamientoList = ({ entrenamientos, onSelect, onTogglePago }: EntrenamientoListProps) => {
  console.log('Renderizando EntrenamientoList con:', entrenamientos);
  
  return (
    <>
      {entrenamientos.length === 0 ? (
        <div className="empty-state">
          <p>No hay entrenamientos para esta fecha.</p>
        </div>
      ) : (
        <div className="entrenamiento-list">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Duración</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {entrenamientos.map((entrenamiento) => {
                console.log('Renderizando entrenamiento:', entrenamiento);
                return (
                  <tr 
                    key={entrenamiento.id} 
                    className={entrenamiento.pagado ? 'pagado' : 'pendiente'}
                  >
                    <td>{entrenamiento.tipo}</td>
                    <td>{entrenamiento.duracion} min</td>
                    <td className="precio">
                      {formatearPrecioCLP(calcularPrecio(
                        entrenamiento.duracion,
                        entrenamiento.incluyeArriendo,
                        entrenamiento.valorArriendo
                      ))}
                      {entrenamiento.incluyeArriendo && entrenamiento.valorArriendo && entrenamiento.valorArriendo > 0 && (
                        <span className="arriendo-badge" title={`Incluye arriendo: ${formatearPrecioCLP(entrenamiento.valorArriendo)}`}>+</span>
                      )}
                    </td>
                    <td>
                      <span className={`status ${entrenamiento.pagado ? 'paid' : 'pending'}`}>
                        {entrenamiento.pagado ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="actions">
                      <button 
                        className="btn-action view"
                        onClick={() => onSelect(entrenamiento)}
                        title="Ver detalles"
                      >
                        📋
                      </button>
                      <button 
                        className={`btn-action payment ${entrenamiento.pagado ? 'unpay' : 'pay'}`}
                        onClick={() => onTogglePago(entrenamiento.id)}
                        title={entrenamiento.pagado ? 'Marcar como no pagado' : 'Marcar como pagado'}
                      >
                        {entrenamiento.pagado ? '❌' : '💰'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default EntrenamientoList; 