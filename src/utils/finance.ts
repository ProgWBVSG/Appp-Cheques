export function calcularOperacionCheque(
    montoNominal: number, 
    fechaEmision: string, 
    fechaVencimiento: string, 
    tasaAnualTNA: number, 
    comisionPorcentaje: number
) {
    const diffTime = new Date(fechaVencimiento).getTime() - new Date(fechaEmision).getTime();
    const dias = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    // Usando base 360 (Año comercial) y TNA expresada en porcentaje (ej: 45 para 45%)
    const interesDescuento = montoNominal * (tasaAnualTNA / 100) * (dias / 360);
    const comisionMonto = montoNominal * (comisionPorcentaje / 100);
    
    const netoCliente = montoNominal - interesDescuento - comisionMonto;
    const gananciaTotal = interesDescuento + comisionMonto;

    return {
        dias,
        interesDescuento: Number(interesDescuento.toFixed(2)),
        comisionMonto: Number(comisionMonto.toFixed(2)),
        netoCliente: Number(netoCliente.toFixed(2)),
        gananciaTotal: Number(gananciaTotal.toFixed(2))
    };
}
