/**
 * Calcula el precio de un entrenamiento según su duración
 * Base: 35.000 CLP por 60 minutos
 */

// Precio base por 60 minutos
export const PRECIO_BASE = 35000;
export const DURACION_BASE = 60;

/**
 * Calcula el precio de un entrenamiento según la duración en minutos
 * @param duracion Duración del entrenamiento en minutos
 * @param incluyeArriendo Si incluye arriendo de cancha
 * @param valorArriendo Valor del arriendo de cancha
 * @returns Precio en CLP
 */
export const calcularPrecio = (
  duracion: number, 
  incluyeArriendo?: boolean, 
  valorArriendo?: number
): number => {
  const precioDuracion = Math.round((duracion / DURACION_BASE) * PRECIO_BASE);
  const precioArriendo = (incluyeArriendo && valorArriendo) ? valorArriendo : 0;
  
  return precioDuracion + precioArriendo;
};

/**
 * Formatea un valor monetario como string con formato CLP
 * @param valor Valor a formatear
 * @returns String formateado (ej: "$35.000")
 */
export const formatearPrecioCLP = (valor: number): string => {
  return `$${valor.toLocaleString('es-CL')}`;
}; 