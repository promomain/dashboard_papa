import { useState, FormEvent } from 'react';
import { Entrenamiento } from '../App';
import '../styles/EntrenamientoForm.css';

interface EntrenamientoFormProps {
  initialEntrenamiento?: Entrenamiento;
  initialDate?: Date;
  onSubmit: (entrenamiento: Omit<Entrenamiento, 'id'>) => void;
  onCancel: () => void;
}

const EntrenamientoForm = ({ 
  initialEntrenamiento, 
  initialDate = new Date(), 
  onSubmit, 
  onCancel 
}: EntrenamientoFormProps) => {
  const [formData, setFormData] = useState<Omit<Entrenamiento, 'id'>>({
    fecha: initialEntrenamiento?.fecha || initialDate,
    tipo: initialEntrenamiento?.tipo || '',
    duracion: initialEntrenamiento?.duracion || 60,
    notas: initialEntrenamiento?.notas || '',
    pagado: initialEntrenamiento?.pagado || false,
    incluyeArriendo: initialEntrenamiento?.incluyeArriendo || false,
    valorArriendo: initialEntrenamiento?.valorArriendo || 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let newValue: any = value;
    
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'duracion' || name === 'valorArriendo') {
      newValue = parseInt(value, 10) || 0;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Si cambia el tipo, resetear campos de arriendo si no es "Clases de padel"
    if (name === 'tipo' && value !== 'Clases de padel') {
      setFormData(prev => ({
        ...prev,
        incluyeArriendo: false,
        valorArriendo: 0
      }));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Calcular el precio total incluyendo arriendo si aplica
  const calcularPrecioTotal = () => {
    const precioDuracion = (formData.duracion / 60) * 35000;
    const precioArriendo = formData.incluyeArriendo ? (formData.valorArriendo || 0) : 0;
    return (precioDuracion + precioArriendo).toLocaleString('es-CL');
  };

  return (
    <div className="entrenamiento-form">
      <h3>{initialEntrenamiento ? 'Editar' : 'Añadir'} Entrenamiento</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fecha">Fecha</label>
          <input
            type="date"
            id="fecha"
            name="fecha"
            value={formData.fecha instanceof Date ? formData.fecha.toISOString().split('T')[0] : ''}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="tipo">Tipo de Entrenamiento</label>
          <select
            id="tipo"
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un tipo</option>
            <option value="Clases de padel">Clases de padel</option>
            <option value="Entrenamiento cognitivo">Entrenamiento cognitivo</option>
            <option value="Entrenamiento de movilidad">Entrenamiento de movilidad</option>
            <option value="Entrenamiento de coordinación">Entrenamiento de coordinación</option>
            <option value="Elongación">Elongación</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="duracion">Duración (minutos)</label>
          <input
            type="number"
            id="duracion"
            name="duracion"
            min="15"
            max="180"
            step="15"
            value={formData.duracion}
            onChange={handleChange}
            required
          />
        </div>
        
        {formData.tipo === 'Clases de padel' && (
          <div className="arriendo-section">
            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="incluyeArriendo"
                name="incluyeArriendo"
                checked={formData.incluyeArriendo}
                onChange={handleChange}
              />
              <label htmlFor="incluyeArriendo">¿Incluye arriendo de cancha?</label>
            </div>
            
            {formData.incluyeArriendo && (
              <div className="form-group">
                <label htmlFor="valorArriendo">Valor del arriendo (CLP)</label>
                <input
                  type="number"
                  id="valorArriendo"
                  name="valorArriendo"
                  min="0"
                  step="1000"
                  value={formData.valorArriendo || 0}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
            
            {formData.incluyeArriendo && formData.valorArriendo && formData.valorArriendo > 0 && (
              <div className="precio-total">
                <strong>Precio total:</strong> ${calcularPrecioTotal()}
              </div>
            )}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="notas">Notas</label>
          <textarea
            id="notas"
            name="notas"
            value={formData.notas}
            onChange={handleChange}
            rows={3}
          />
        </div>
        
        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="pagado"
            name="pagado"
            checked={formData.pagado}
            onChange={handleChange}
          />
          <label htmlFor="pagado">Pagado</label>
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn-danger" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            {initialEntrenamiento ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EntrenamientoForm; 