export interface NLPResult {
  tipo: 'ingreso' | 'gasto' | 'meta';
  monto: number;
  concepto: string;
}

// ─────────────────────────────────────────────────────────────────
//  DICCIONARIO DE GASTOS / SALIDAS DE DINERO
//  Cubre: verbos directos, formas reflexivas, jerga argentina,
//  frases de transferencia, pago de deuda, donaciones, etc.
// ─────────────────────────────────────────────────────────────────
const KEYWORDS_GASTO: string[] = [
  // Verbos base (raíz — el includes() captura todas las conjugaciones)
  'gast',   // gasté, gaste, gastamos, gastaron
  'pagu',   // pagué, pague
  'pag',    // pago, pagás, pagan
  'compr',  // compré, compramos, comprar
  'saqu',   // saqué, saque, sacamos
  'retir',  // retiré, retiramos, retiro
  'sali',   // salida, salió
  'envi',   // envié, enviamos → "le envié $5000"
  'mand',   // mandé, mandamos → "mandé plata"
  'prest',  // presté, prestamos → "presté dinero"
  'debit',  // debitaron, debitaron
  'descont',// descontaron
  'cobrar', // cobrar (cuando se refiere a un pago que te sacan)
  'perd',   // perdí, perdimos
  'invert', // invertí, invertimos
  'abon',   // aboné, abonamos
  'transf', // transferí, transfiero
  'le di',  // "le di 5000"
  'di ',    // "di 3000 de propina"
  'doné',   // doné, donar
  'don',    // donación
  'cuot',   // cuota
  'factur', // factura
  'tarjet', // tarjeta
  'cargu',  // cargué la tarjeta
  'renov',  // renuncia / renovación de suscripción
  'cuota',
  'suscri', // suscripción
  'alquil', // alquiler, alquilé
  'expen',  // expensas
  'impu',   // impuesto
  'multa',
  'flet',   // flete
  'arregl', // arreglé el auto / electrodoméstico
  'repar',  // reparación
  'servi',  // servicio, servicios
  'luz',
  'agua',
  'gas',
  'internet',
  'celular',
  'propina',
];

// ─────────────────────────────────────────────────────────────────
//  DICCIONARIO DE INGRESOS / ENTRADAS DE DINERO
// ─────────────────────────────────────────────────────────────────
const KEYWORDS_INGRESO: string[] = [
  'cobr',      // cobré, cobramos, cobrar
  'recib',     // recibí, recibimos
  'ingres',    // ingresé, ingreso
  'entr',      // entró, entraron (cuando se refiere a plata)
  'gan',       // gané, ganamos, ganancia
  'vend',      // vendí, vendimos
  'deposit',   // depositaron, deposité
  'acredit',   // acreditaron
  'me cayó',   // jerga: "me cayó el sueldo"
  'cayó',
  'me pagaron',
  'pagaron',
  'sueldo',
  'salario',
  'aguinaldo',
  'bono',
  'premium',   // bono premium
  'premio',
  'devol',     // devolvieron, me devolvieron
  'reintegr',  // reintegro
  'factur',    // facturé
  'comision',  // comisión
  'honorar',   // honorarios
  'renta',
  'alquil',    // "cobré el alquiler"
  'dividendo',
  'interes',   // intereses a favor
  'rendimient',// rendimiento
  'extraj',    // "saqué del plazo fijo" / extra
  'venta',
  'vendi',
];

// ─────────────────────────────────────────────────────────────────
//  PALABRAS DE META / OBJETIVO
// ─────────────────────────────────────────────────────────────────
const KEYWORDS_META: string[] = [
  'meta', 'objetivo', 'alcanzar', 'llegar a', 'quiero llegar',
  'quiero ganar', 'propósito', 'propósito', 'propon', 'planificar', 'lograr',
];

// ─────────────────────────────────────────────────────────────────
//  PARSER DE NÚMEROS
//  Maneja: 5000, 5.000, $5000, 5k, 5 mil, cinco lucas, etc.
// ─────────────────────────────────────────────────────────────────
const wordsToNumbers: Record<string, number> = {
  'cero': 0, 'un': 1, 'uno': 1, 'una': 1, 'dos': 2, 'tres': 3,
  'cuatro': 4, 'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9,
  'diez': 10, 'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14,
  'quince': 15, 'dieciséis': 16, 'diecisiete': 17, 'dieciocho': 18, 'diecinueve': 19,
  'veinte': 20, 'veintiuno': 21, 'veintidós': 22, 'veintitrés': 23,
  'treinta': 30, 'cuarenta': 40, 'cincuenta': 50, 'sesenta': 60,
  'setenta': 70, 'ochenta': 80, 'noventa': 90,
  'cien': 100, 'ciento': 100, 'doscientos': 200, 'trescientos': 300,
  'cuatrocientos': 400, 'quinientos': 500, 'seiscientos': 600,
  'setecientos': 700, 'ochocientos': 800, 'novecientos': 900,
};

function parseWrittenNumber(text: string): number | null {
  // Busca dígitos primero (ej: "$5.000", "5000", "5k")
  const numRegex = /\$?\s*(\d[\d.,]*)(?:\s*(mil|lucas|kilo|k|millones?|pesos|plata|guita))?/i;
  const match = text.match(numRegex);

  if (match) {
    // Elimina puntos de miles y convierte comas en punto decimal
    let raw = match[1].replace(/\./g, '').replace(',', '.');
    let num = parseFloat(raw);
    if (isNaN(num)) return null;
    const multiplier = match[2]?.toLowerCase();
    if (multiplier === 'mil' || multiplier === 'lucas' || multiplier === 'kilo' || multiplier === 'k') num *= 1000;
    if (multiplier && (multiplier.startsWith('millon'))) num *= 1_000_000;
    return num;
  }

  // Si no hay dígitos, intenta con palabras ("cinco mil")
  let total = 0;
  let current = 0;
  let foundNumber = false;
  const tokens = text.toLowerCase().replace(/[.,]/g, '').split(/\s+/);

  for (const token of tokens) {
    if (wordsToNumbers[token] !== undefined) {
      current += wordsToNumbers[token];
      foundNumber = true;
    } else if (['mil', 'lucas', 'kilo'].includes(token)) {
      total += (current === 0 ? 1 : current) * 1000;
      current = 0;
      foundNumber = true;
    } else if (token.startsWith('millon')) {
      total += (current === 0 ? 1 : current) * 1_000_000;
      current = 0;
      foundNumber = true;
    }
  }

  total += current;
  return foundNumber && total > 0 ? total : null;
}

// ─────────────────────────────────────────────────────────────────
//  FUNCIÓN PRINCIPAL DE PARSEO
// ─────────────────────────────────────────────────────────────────
export function parseTransaction(transcript: string): NLPResult | null {
  const t = transcript.toLowerCase();

  let tipo: 'ingreso' | 'gasto' | 'meta' | null = null;

  // Prioridad 1: GASTO
  if (KEYWORDS_GASTO.some(k => t.includes(k))) {
    tipo = 'gasto';
  }
  // Prioridad 2: INGRESO
  else if (KEYWORDS_INGRESO.some(k => t.includes(k))) {
    tipo = 'ingreso';
  }
  // Prioridad 3: META
  else if (KEYWORDS_META.some(k => t.includes(k))) {
    tipo = 'meta';
  }

  if (!tipo) return null;

  const monto = parseWrittenNumber(t);
  if (!monto) return null;

  // ── Extracción inteligente del concepto ──────────────────────
  // Regex de TODOS los verbos/frases de acción conjugados para borrarlos
  const actionRegex = new RegExp(
    '\\b(' +
    [
      // Gastos
      'gast[éeamos]+','pagu[éeamos]+','pag[oóaron]+','compr[éeamos]+',
      'saqu[éeamos]+','sali[óo]','envi[éeamos]+','mand[éeamos]+',
      'prest[éeamos]+','debitaron','descontaron','perd[íieimos]+',
      'invert[íiimos]+','abon[éeamos]+','transf[eiero]+','le di','le dimos','di ',
      'don[éeamos]+','cuota','cuotas','factura','tarjeta',
      'alquil[éeamos]+','arregl[éeamos]+','repar[éeamos]+',
      // Ingresos
      'cobr[éeamos]+','recib[íiimos]+','ingres[éeamos]+',
      'entr[oóaron]+','gan[éeamos]+','vend[íiimos]+',
      'deposit[oóaron]+','acredit[oóaron]+','me cayó','cayó',
      'me pagaron','pagaron','devol[viieron]+','reintegr[oóaron]+',
      // Neutros
      'meta','objetivo','tuve','gasté en',
    ].join('|') +
    ')\\b',
    'gi'
  );

  let concepto = transcript;
  concepto = concepto.replace(actionRegex, ' ');
  // Borrar el monto (números, signo, multiplicadores)
  concepto = concepto.replace(/\$?\s*\d[\d.,]*\s*(mil|lucas|kilo|k|millones?|pesos|plata|guita)?/gi, ' ');
  // Borrar conectores y artículos
  concepto = concepto.replace(/\b(le|la|lo|los|las|el|un|una|en|de|por|a|al|con|del|para|que|me|mi|mis|su|sus|y|o|e)\b/gi, ' ');
  // Limpiar espacios
  concepto = concepto.replace(/\s+/g, ' ').trim();

  if (!concepto && tipo === 'meta') concepto = 'Meta mensual';
  if (!concepto) concepto = 'Operación registrada por voz';

  return { tipo, monto, concepto };
}
