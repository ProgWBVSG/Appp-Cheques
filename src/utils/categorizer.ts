// Motor de categorización automática por palabras clave
// Analiza el concepto o el transcript original y asigna una categoría

export type Categoria =
  | 'Transporte'
  | 'Hogar & Servicios'
  | 'Comida'
  | 'Salud'
  | 'Entretenimiento'
  | 'Ropa & Calzado'
  | 'Educación'
  | 'Familia & Personas'
  | 'Trabajo & Negocios'
  | 'Finanzas'
  | 'Otros';

interface CategoriaConfig {
  label: Categoria;
  color: string;
  keywords: string[];
}

export const CATEGORIAS: CategoriaConfig[] = [
  {
    label: 'Transporte',
    color: '#3B82F6',
    keywords: [
      'nafta', 'naftear', 'combustible', 'gasoil', 'diesel',
      'uber', 'cabify', 'remis', 'taxi', 'colectivo', 'bondi', 'subte', 'tren', 'micro',
      'peaje', 'estacionamiento', 'autopista', 'garage',
      'mecánico', 'mecanico', 'taller', 'auto', 'moto', 'bici',
      'service', 'patente', 'seguro del auto', 'vtv', 'gnc',
      'aeropuerto', 'avión', 'avion', 'vuelo', 'pasaje',
    ],
  },
  {
    label: 'Hogar & Servicios',
    color: '#8B5CF6',
    keywords: [
      'luz', 'gas', 'agua', 'internet', 'wifi', 'cable', 'telefono', 'teléfono',
      'alquiler', 'alquilar', 'expensas', 'cuota del depto', 'cuota de la casa',
      'hipoteca', 'inmobiliaria',
      'pintura', 'pintar', 'plomero', 'plomería', 'plomeria',
      'electricista', 'gasista', 'albañil', 'albanil', 'obra',
      'electrodoméstico', 'electrodomestico', 'heladera', 'lavarropas', 'cocina',
      'televisión', 'television', 'tele', 'aire acondicionado',
      'mueble', 'sillón', 'sillon', 'cama', 'colchón', 'colchon',
      'limpieza', 'detergente', 'escoba', 'balde',
      'jardinero', 'gastos del hogar', 'hogar',
    ],
  },
  {
    label: 'Comida',
    color: '#F97316',
    keywords: [
      'comida', 'comer', 'almuerzo', 'cena', 'desayuno', 'merienda',
      'supermercado', 'super', 'mercado', 'verdulería', 'verduleria',
      'carnicería', 'carniceria', 'panadería', 'panaderia',
      'pizza', 'empanada', 'sushi', 'hamburguesa', 'burger',
      'restaurante', 'restaurant', 'bar', 'cafetería', 'cafeteria', 'café',
      'delivery', 'pedidos ya', 'rappi', 'mcdonald', 'mcdonalds',
      'kiosco', 'kiosko', 'almacén', 'almacen',
      'fiambre', 'queso', 'leche', 'verdura', 'fruta',
      'ñoqui', 'pasta', 'asado', 'bbq',
    ],
  },
  {
    label: 'Salud',
    color: '#22C55E',
    keywords: [
      'médico', 'medico', 'doctor', 'consultorio', 'hospital', 'clínica', 'clinica',
      'farmacia', 'medicamento', 'remedio', 'pastilla', 'droga',
      'obra social', 'prepaga', 'seguro médico', 'seguro medico',
      'dentista', 'odontólogo', 'odontologo', 'psicólogo', 'psicologo',
      'kinesiólogo', 'kinesiologo', 'fisioterapeuta', 'análisis', 'analisis',
      'laboratorio', 'radiografía', 'radiografia', 'ecografía', 'ecografia',
      'lentes', 'anteojos', 'óptica', 'optica', 'vitaminas', 'suplemento',
    ],
  },
  {
    label: 'Entretenimiento',
    color: '#EC4899',
    keywords: [
      'poker', 'casino', 'apuesta', 'jugando', 'juego',
      'cine', 'teatro', 'recital', 'concierto', 'show', 'entrada',
      'netflix', 'spotify', 'disney', 'hbo', 'prime', 'youtube',
      'suscripción', 'suscripcion', 'streaming',
      'gym', 'gimnasio', 'club', 'deporte', 'fútbol', 'futbol', 'tenis',
      'vacaciones', 'hotel', 'airbnb', 'turismo', 'viaje',
      'cumpleaños', 'fiesta', 'regalo', 'presente',
      'libro', 'revista', 'diario',
    ],
  },
  {
    label: 'Ropa & Calzado',
    color: '#F59E0B',
    keywords: [
      'ropa', 'remera', 'camisa', 'pantalón', 'pantalon', 'jean', 'jeans',
      'zapatilla', 'zapato', 'bota', 'sandalia', 'calzado',
      'campera', 'saco', 'chompa', 'buzo', 'abrigo',
      'ropa interior', 'medias', 'corbata',
      'tintorería', 'tintoreria', 'lavandería', 'lavanderia',
    ],
  },
  {
    label: 'Educación',
    color: '#06B6D4',
    keywords: [
      'colegio', 'escuela', 'universidad', 'facultad', 'instituto', 'academia',
      'cuota del colegio', 'cuota de la facultad', 'matrícula', 'matricula',
      'libro', 'útiles', 'utiles', 'materiales', 'fotocopias', 'apuntes',
      'curso', 'taller', 'inglés', 'ingles', 'idioma',
      'guardería', 'guarderia', 'jardín', 'jardin', 'kinder',
    ],
  },
  {
    label: 'Familia & Personas',
    color: '#A78BFA',
    keywords: [
      'hijo', 'hija', 'nene', 'nena', 'niño', 'niña', 'bebé', 'bebe',
      'esposa', 'esposo', 'marido', 'mujer', 'pareja', 'novio', 'novia',
      'madre', 'mamá', 'mama', 'padre', 'papá', 'papa', 'abuelo', 'abuela',
      'hermano', 'hermana', 'familiar', 'familia',
      'amigo', 'amiga', 'compañero', 'socio',
    ],
  },
  {
    label: 'Trabajo & Negocios',
    color: '#64748B',
    keywords: [
      'oficina', 'trabajo', 'negocio', 'empresa', 'comercio',
      'herramienta', 'material', 'insumo', 'mercadería', 'mercaderia',
      'proveedor', 'factura del negocio', 'gasto del negocio',
      'impuesto', 'afip', 'iva', 'ganancias', 'monotributo',
      'contador', 'abogado', 'gestor',
    ],
  },
  {
    label: 'Finanzas',
    color: '#10B981',
    keywords: [
      'banco', 'préstamo', 'prestamo', 'crédito', 'credito', 'deuda',
      'cuota del banco', 'cuota del crédito',
      'inversión', 'inversion', 'plazo fijo', 'cripto', 'dólar', 'dolar',
      'transferencia', 'comisión', 'comision', 'mantenimiento de cuenta',
    ],
  },
];

export function detectarCategoria(texto: string): Categoria {
  const t = texto.toLowerCase();
  for (const cat of CATEGORIAS) {
    if (cat.keywords.some(k => t.includes(k))) {
      return cat.label;
    }
  }
  return 'Otros';
}

export function getColorCategoria(categoria: Categoria): string {
  return CATEGORIAS.find(c => c.label === categoria)?.color ?? '#6B7280';
}
