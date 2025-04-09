import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { onAuthStateChanged } from 'firebase/auth'

import EntrenamientoForm from './components/EntrenamientoForm'
import EntrenamientoList from './components/EntrenamientoList'
import EntrenamientoDetail from './components/EntrenamientoDetail'
import EntrenamientoSearch from './components/EntrenamientoSearch'
import Header from './components/Header'
import Login from './components/Login'

import { auth } from './firebase'
import { 
  suscribirseAEntrenamientos, 
  agregarEntrenamiento, 
  actualizarEntrenamiento, 
  eliminarEntrenamiento, 
  cambiarEstadoPago 
} from './services/firestore'

import './styles/App.css'

export interface Entrenamiento {
  id: string;
  fecha: Date;
  tipo: string;
  duracion: number;
  notas: string;
  pagado: boolean;
  incluyeArriendo?: boolean;
  valorArriendo?: number;
}

// Añadir esta función auxiliar para comparar fechas sin horas
const esMismaFecha = (fecha1: Date, fecha2: Date): boolean => {
  // Verificar que ambas son instancias de Date
  if (!(fecha1 instanceof Date) || !(fecha2 instanceof Date)) {
    console.error('Error: una de las fechas no es un objeto Date válido', { fecha1, fecha2 });
    return false;
  }

  // Convertir a fechas UTC para evitar problemas de zona horaria
  const fecha1UTC = new Date(Date.UTC(
    fecha1.getFullYear(),
    fecha1.getMonth(),
    fecha1.getDate()
  ));
  
  const fecha2UTC = new Date(Date.UTC(
    fecha2.getFullYear(),
    fecha2.getMonth(),
    fecha2.getDate()
  ));
  
  // Comparar valores de tiempo para las fechas UTC (ignorando horas/minutos/segundos)
  const sonIguales = fecha1UTC.getTime() === fecha2UTC.getTime();
  
  console.log(`Comparando fechas: 
    Fecha1: ${fecha1.toISOString()} (${fecha1UTC.toISOString()}) 
    Fecha2: ${fecha2.toISOString()} (${fecha2UTC.toISOString()})
    Son iguales: ${sonIguales}`);
  
  return sonIguales;
};

function App() {
  const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEntrenamiento, setSelectedEntrenamiento] = useState<Entrenamiento | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showCalendar, setShowCalendar] = useState(!isMobile);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Verificar estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Detectar cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowCalendar(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Suscribirse a cambios en los entrenamientos en Firestore
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = suscribirseAEntrenamientos((data) => {
      console.log('Datos recibidos de Firestore:', data);
      setEntrenamientos(data);
    });
    
    return () => unsubscribe();
  }, [user]);

  const handleDateChange = (date: Date | Date[]) => {
    if (Array.isArray(date)) return;
    
    setSelectedDate(date);
    setSelectedEntrenamiento(null);
    if (isMobile) {
      setShowCalendar(false);
    }
  };

  const handleAddEntrenamiento = async (entrenamiento: Omit<Entrenamiento, 'id'>) => {
    try {
      await agregarEntrenamiento(entrenamiento);
      setShowForm(false);
    } catch (error) {
      console.error('Error al agregar entrenamiento:', error);
      alert('Error al guardar el entrenamiento. Inténtalo de nuevo.');
    }
  };

  const handleUpdateEntrenamiento = async (updatedEntrenamiento: Entrenamiento) => {
    try {
      await actualizarEntrenamiento(updatedEntrenamiento);
      setSelectedEntrenamiento(null);
    } catch (error) {
      console.error('Error al actualizar entrenamiento:', error);
      alert('Error al actualizar el entrenamiento. Inténtalo de nuevo.');
    }
  };

  const handleDeleteEntrenamiento = async (id: string) => {
    try {
      await eliminarEntrenamiento(id);
      setSelectedEntrenamiento(null);
    } catch (error) {
      console.error('Error al eliminar entrenamiento:', error);
      alert('Error al eliminar el entrenamiento. Inténtalo de nuevo.');
    }
  };

  const handleTogglePago = async (id: string) => {
    try {
      const entrenamiento = entrenamientos.find(ent => ent.id === id);
      if (entrenamiento) {
        await cambiarEstadoPago(id, !entrenamiento.pagado);
      }
    } catch (error) {
      console.error('Error al cambiar estado de pago:', error);
      alert('Error al actualizar el estado de pago. Inténtalo de nuevo.');
    }
  };

  const entrenamientosByDate = entrenamientos.filter((ent) => {
    console.log('Comparando fecha de entrenamiento:', ent.fecha, 'con fecha seleccionada:', selectedDate);
    const coincide = esMismaFecha(ent.fecha, selectedDate);
    console.log('¿Coinciden las fechas?', coincide);
    return coincide;
  });

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    
    const hasEntrenamiento = entrenamientos.some(
      (ent) => format(ent.fecha, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    const hasPendingPayment = entrenamientos.some(
      (ent) => 
        format(ent.fecha, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && 
        !ent.pagado
    );
    
    return (
      <div className="tile-content">
        {hasEntrenamiento && (
          <div 
            className={`dot ${hasPendingPayment ? 'pending' : 'paid'}`} 
            title={hasPendingPayment ? 'Pagos pendientes' : 'Todo pagado'}
          />
        )}
      </div>
    );
  };

  const handleToggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!user) {
    return <Login onLogin={() => setUser(auth.currentUser)} />;
  }

  return (
    <div className="app">
      <Header 
        onSearchClick={() => setShowSearch(true)} 
        onLogout={() => auth.signOut()}
        userEmail={user.email}
      />
      <div className="container">
        {showSearch ? (
          <EntrenamientoSearch 
            entrenamientos={entrenamientos} 
            onClose={() => setShowSearch(false)} 
            onDataChange={() => {
              // Esto recargará los datos después de marcar todos como pagados
              const unsubscribe = suscribirseAEntrenamientos((data) => {
                console.log('Recargando datos después de actualización masiva');
                setEntrenamientos(data);
                unsubscribe(); // Desuscribirse inmediatamente después de la actualización
              });
            }}
          />
        ) : (
          <div className="dashboard">
            {isMobile && (
              <div className="mobile-controls">
                <button className="btn-toggle-calendar" onClick={handleToggleCalendar}>
                  {showCalendar ? 'Ocultar Calendario' : 'Mostrar Calendario'}
                </button>
                <button className="btn-primary add-btn-mobile" onClick={() => setShowForm(true)}>
                  Añadir
                </button>
              </div>
            )}
            
            {(showCalendar || !isMobile) && (
              <div className="sidebar">
                <Calendar 
                  onChange={handleDateChange} 
                  value={selectedDate}
                  locale="es-ES"
                  tileContent={tileContent}
                />
                {!isMobile && (
                  <button 
                    className="btn-primary add-btn" 
                    onClick={() => setShowForm(true)}
                  >
                    Añadir Entrenamiento
                  </button>
                )}
              </div>
            )}
            
            <div className="main-content">
              <h2>
                Entrenamientos: {format(selectedDate, 'PPPP', { locale: es })}
              </h2>
              
              {showForm ? (
                <EntrenamientoForm 
                  onSubmit={handleAddEntrenamiento} 
                  onCancel={() => setShowForm(false)}
                  initialDate={selectedDate}
                />
              ) : selectedEntrenamiento ? (
                <EntrenamientoDetail 
                  entrenamiento={selectedEntrenamiento} 
                  onBack={() => setSelectedEntrenamiento(null)}
                  onUpdate={handleUpdateEntrenamiento}
                  onDelete={handleDeleteEntrenamiento}
                />
              ) : (
                <EntrenamientoList 
                  entrenamientos={entrenamientosByDate} 
                  onSelect={setSelectedEntrenamiento}
                  onTogglePago={handleTogglePago}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App 