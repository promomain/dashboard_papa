import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Entrenamiento } from '../App';
import EntrenamientoForm from './EntrenamientoForm';
import { calcularPrecio, formatearPrecioCLP } from '../utils/priceCalculator';
import '../styles/EntrenamientoDetail.css';

interface EntrenamientoDetailProps {
  entrenamiento: Entrenamiento;
  onBack: () => void;
  onUpdate: (entrenamiento: Entrenamiento) => void;
  onDelete: (id: string) => void;
}

const EntrenamientoDetail = ({ 
  entrenamiento, 
  onBack, 
  onUpdate, 
  onDelete 
}: EntrenamientoDetailProps) => {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleUpdate = (updatedData: Omit<Entrenamiento, 'id'>) => {
    onUpdate({
      ...updatedData,
      id: entrenamiento.id,
    });
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(entrenamiento.id);
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <div className="entrenamiento-detail">
      {editing ? (
        <EntrenamientoForm 
          initialEntrenamiento={entrenamiento}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="detail-header">
            <h3>Detalles del Entrenamiento</h3>
            <div className="detail-actions">
              <button 
                className="btn-primary" 
                onClick={() => setEditing(true)}
              >
                Editar
              </button>
              <button 
                className="btn-danger" 
                onClick={handleDelete}
              >
                {confirmDelete ? 'Confirmar Borrado' : 'Borrar'}
              </button>
            </div>
          </div>
          
          <div className="detail-content">
            <div className="detail-group">
              <span className="detail-label">Estado:</span>
              <span className={`status ${entrenamiento.pagado ? 'paid' : 'pending'}`}>
                {entrenamiento.pagado ? 'Pagado' : 'Pendiente de pago'}
              </span>
            </div>
            
            <div className="detail-group">
              <span className="detail-label">Fecha:</span>
              <span>{format(entrenamiento.fecha, 'PPPP', { locale: es })}</span>
            </div>
            
            <div className="detail-group">
              <span className="detail-label">Tipo:</span>
              <span>{entrenamiento.tipo}</span>
            </div>
            
            <div className="detail-group">
              <span className="detail-label">Duración:</span>
              <span>{entrenamiento.duracion} minutos</span>
            </div>
            
            {entrenamiento.tipo === 'Clases de padel' && entrenamiento.incluyeArriendo && (
              <div className="detail-group arriendo">
                <span className="detail-label">Arriendo de cancha:</span>
                <span>{formatearPrecioCLP(entrenamiento.valorArriendo || 0)}</span>
              </div>
            )}
            
            <div className="detail-group">
              <span className="detail-label">Precio:</span>
              <span className="detail-price">
                {formatearPrecioCLP(calcularPrecio(
                  entrenamiento.duracion, 
                  entrenamiento.incluyeArriendo, 
                  entrenamiento.valorArriendo
                ))}
              </span>
            </div>
            
            {entrenamiento.notas && (
              <div className="detail-group notes">
                <span className="detail-label">Notas:</span>
                <p>{entrenamiento.notas}</p>
              </div>
            )}
          </div>
          
          <button 
            className="btn-back" 
            onClick={onBack}
          >
            Volver a la lista
          </button>
        </>
      )}
    </div>
  );
};

export default EntrenamientoDetail; 