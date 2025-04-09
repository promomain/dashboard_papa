import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Entrenamiento } from '../App';

const COLLECTION_NAME = 'entrenamientos';

// Añadir una función de depuración para verificar fechas
const depurarFecha = (label: string, fecha: any) => {
  console.log(`${label}:`, {
    original: fecha,
    tipo: typeof fecha,
    esDate: fecha instanceof Date,
    timestamp: fecha instanceof Date ? fecha.getTime() : 'No es Date',
    toString: fecha instanceof Date ? fecha.toString() : 'No es Date',
    componentes: fecha instanceof Date ? {
      año: fecha.getFullYear(),
      mes: fecha.getMonth() + 1,
      día: fecha.getDate(),
      hora: fecha.getHours(),
      minutos: fecha.getMinutes(),
      segundos: fecha.getSeconds(),
      zonaHoraria: fecha.getTimezoneOffset() / -60
    } : 'No es Date'
  });
};

// Convierte un documento de Firestore a nuestro tipo Entrenamiento
const convertirFirestoreDoc = (doc: any): Entrenamiento => {
  const data = doc.data();
  console.log('Documento de Firestore:', doc.id, data);
  
  // Asegurarnos que la fecha se convierte correctamente
  let fecha;
  if (data.fecha && typeof data.fecha.toDate === 'function') {
    console.log("Detectado Timestamp de Firestore");
    fecha = data.fecha.toDate();
  } else if (data.fecha instanceof Date) {
    console.log("Detectado objeto Date");
    fecha = data.fecha;
  } else if (data.fecha) {
    console.log("Intentando convertir otro tipo:", typeof data.fecha);
    // Intentar convertir de timestamp o string
    fecha = new Date(data.fecha);
  } else {
    console.error('Fecha inválida en documento:', doc.id);
    fecha = new Date(); // Fallback
  }
  
  depurarFecha("Fecha convertida", fecha);
  
  return {
    id: doc.id,
    fecha: fecha,
    tipo: data.tipo || '',
    duracion: Number(data.duracion) || 0,
    notas: data.notas || '',
    pagado: data.pagado === true,
    incluyeArriendo: data.incluyeArriendo === true,
    valorArriendo: Number(data.valorArriendo) || 0
  };
};

// Convierte nuestro tipo Entrenamiento para guardar en Firestore
const prepararParaFirestore = (entrenamiento: Omit<Entrenamiento, 'id'>) => {
  console.log('Preparando para guardar en Firestore:', entrenamiento);
  depurarFecha("Fecha a guardar", entrenamiento.fecha);
  
  const datoPreparado = {
    ...entrenamiento,
    fecha: Timestamp.fromDate(entrenamiento.fecha)
  };
  
  console.log('Datos listos para guardar:', datoPreparado);
  return datoPreparado;
};

// Obtener todos los entrenamientos del usuario actual
export const obtenerEntrenamientos = async (): Promise<Entrenamiento[]> => {
  if (!auth.currentUser) {
    return [];
  }

  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('fecha', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertirFirestoreDoc);
};

// Suscribirse a cambios en tiempo real
export const suscribirseAEntrenamientos = (callback: (entrenamientos: Entrenamiento[]) => void) => {
  if (!auth.currentUser) {
    callback([]);
    return () => {}; // Función de limpieza
  }

  console.log('Suscribiéndose a entrenamientos');
  
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('fecha', 'desc')
  );

  // Devuelve una función de cancelación
  return onSnapshot(q, (snapshot) => {
    console.log('Recibidos datos de Firebase:', snapshot.docs.length, 'documentos');
    const entrenamientos = snapshot.docs.map(convertirFirestoreDoc);
    callback(entrenamientos);
  }, (error) => {
    console.error('Error en la suscripción a Firestore:', error);
  });
};

// Agregar un nuevo entrenamiento
export const agregarEntrenamiento = async (entrenamiento: Omit<Entrenamiento, 'id'>): Promise<string> => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), prepararParaFirestore(entrenamiento));
  return docRef.id;
};

// Actualizar un entrenamiento existente
export const actualizarEntrenamiento = async (entrenamiento: Entrenamiento): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  const { id, ...data } = entrenamiento;
  await updateDoc(doc(db, COLLECTION_NAME, id), prepararParaFirestore(data));
};

// Eliminar un entrenamiento
export const eliminarEntrenamiento = async (id: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  await deleteDoc(doc(db, COLLECTION_NAME, id));
};

// Cambiar estado de pago
export const cambiarEstadoPago = async (id: string, pagado: boolean): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  await updateDoc(doc(db, COLLECTION_NAME, id), { pagado });
};

// Cambiar estado de pago para múltiples entrenamientos a la vez
export const cambiarEstadoPagoMultiple = async (ids: string[], pagado: boolean): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  if (ids.length === 0) return;

  // Usamos una transacción por lotes para actualizar múltiples documentos
  const batch = writeBatch(db);
  
  ids.forEach(id => {
    const docRef = doc(db, COLLECTION_NAME, id);
    batch.update(docRef, { pagado });
  });
  
  await batch.commit();
  console.log(`Actualizados ${ids.length} entrenamientos a pagado=${pagado}`);
}; 