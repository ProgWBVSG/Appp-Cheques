export function generarMensajeWhatsApp(
  nombreCliente: string,
  banco: string,
  nroCheque: string,
  monto: number,
  fechaVencimiento: string,
  dias: number,
  tasa: number,
  comision: number,
  netoCliente: number
): string {
  const formatearMoneda = (valor: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);

  const texto = `Hola *${nombreCliente}*, te paso el detalle de la liquidación de la operación de cheques:

🏦 *Banco:* ${banco} | *N°:* ${nroCheque}
💵 *Monto Nominal:* $${formatearMoneda(monto)}
📅 *Vencimiento:* ${fechaVencimiento} (${dias} días)
📉 *Tasa aplicada:* ${tasa}% TNA
⚙️ *Gastos / Comisión:* $${formatearMoneda(comision)}

💰 *Neto a acreditar:* $${formatearMoneda(netoCliente)}

Cualquier duda avisame. ¡Gracias!`;

  return texto;
}

export function abrirWhatsApp(telefono: string, mensaje: string) {
  // Eliminar espacios, guiones o símbolos del teléfono
  const telLimpio = telefono.replace(/\D/g, '');
  const url = `https://api.whatsapp.com/send?phone=${telLimpio}&text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}
