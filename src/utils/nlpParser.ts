export interface NLPResult {
  tipo: 'ingreso' | 'gasto' | 'meta';
  monto: number;
  concepto: string;
}

const wordsToNumbers: Record<string, number> = {
  'uno': 1, 'un': 1, 'una': 1,
  'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
  'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
  'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
  'veinte': 20, 'treinta': 30, 'cuarenta': 40, 'cincuenta': 50,
  'sesenta': 60, 'setenta': 70, 'ochenta': 80, 'noventa': 90,
  'cien': 100, 'ciento': 100,
  'quinientos': 500
  // Para valores más grandes o complejos, se recomienda usar los dígitos que el propio speech-to-text suele retornar.
};

function parseWrittenNumber(text: string): number | null {
  // Primero busca números directos (ej: "1500", "1.500", "15k")
  const numRegex = /(?:[$]?\s*)?(\d+(?:[.,]\d+)?)\s*(mil|lucas|k|m|millones)?/i;
  const match = text.match(numRegex);
  
  if (match) {
    let num = parseFloat(match[1].replace(/,/g, ''));
    const multiplier = match[2]?.toLowerCase();
    
    if (multiplier === 'mil' || multiplier === 'lucas' || multiplier === 'k') num *= 1000;
    if (multiplier === 'm' || multiplier === 'millones') num *= 1000000;
    
    return num;
  }
  
  // Buscar palabras de números si no hay dígitos
  let total = 0;
  let current = 0;
  
  const tokens = text.toLowerCase().split(/\s+/);
  let foundNumber = false;
  
  for (const token of tokens) {
    if (wordsToNumbers[token]) {
      current += wordsToNumbers[token];
      foundNumber = true;
    } else if (token === 'mil' || token === 'lucas') {
      total += (current === 0 ? 1 : current) * 1000;
      current = 0;
      foundNumber = true;
    } else if (token === 'millón' || token === 'millon' || token === 'millones') {
      total += (current === 0 ? 1 : current) * 1000000;
      current = 0;
      foundNumber = true;
    }
  }
  
  total += current;
  return foundNumber ? total : null;
}

export function parseTransaction(transcript: string): NLPResult | null {
  const t = transcript.toLowerCase();
  
  let tipo: 'ingreso' | 'gasto' | 'meta' | null = null;
  
  if (t.includes('gast') || t.includes('compr') || t.includes('pagu') || t.includes('salida') || t.includes('gasto')) {
    tipo = 'gasto';
  } else if (t.includes('cobr') || t.includes('ingres') || t.includes('recibí') || t.includes('entró')) {
    tipo = 'ingreso';
  } else if (t.includes('meta') || t.includes('objetivo') || t.includes('alcanzar')) {
    tipo = 'meta';
  }
  
  if (!tipo) return null;

  const monto = parseWrittenNumber(t);
  if (!monto) return null; // Si no hay monto, falló
  
  // Limpiar la frase para sacar el concepto
  // Ej: "Gasté 500 en la carnicería" -> concepto: "la carnicería"
  // "Pagué 1000 pesos de luz" -> concepto: "luz"
  let concepto = transcript;
  
  // Eliminar palabras de acción
  concepto = concepto.replace(/(gasté|gaste|gasto|compré|compre|pagué|pague|cobré|cobre|ingresé|meta|objetivo)\b/gi, '');
  // Eliminar el monto y palabras asociadas
  concepto = concepto.replace(/\d+(?:[.,]\d+)?\s*(mil|lucas|k|m|millones|pesos|dólares|dolares|usd)?/gi, '');
  // Eliminar preposiciones comunes de conexión
  concepto = concepto.replace(/\b(en|de|por)\b/gi, '');
  
  // Limpiar espacios dobles
  concepto = concepto.replace(/\s+/g, ' ').trim();
  
  if (!concepto && tipo === 'meta') concepto = 'Meta mensual';
  if (!concepto) concepto = 'Operación por voz';
  
  return { tipo, monto, concepto };
}
