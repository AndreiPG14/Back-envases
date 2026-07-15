export type ValidationError = { field: string; message: string };

export function validarRequeridos(
  body: Record<string, any>,
  campos: string[]
): ValidationError[] {
  return campos
    .filter((c) => body[c] === undefined || body[c] === null || body[c] === '')
    .map((c) => ({ field: c, message: `${c} es requerido` }));
}

export function validarMaxLength(
  body: Record<string, any>,
  campos: Record<string, number>
): ValidationError[] {
  return Object.entries(campos)
    .filter(([field, max]) => body[field] && String(body[field]).length > max)
    .map(([field, max]) => ({ field, message: `${field} no puede superar ${max} caracteres` }));
}

export function validarNumeroPositivo(
  body: Record<string, any>,
  campos: string[]
): ValidationError[] {
  return campos
    .filter((c) => body[c] !== undefined && body[c] !== null && Number(body[c]) < 0)
    .map((c) => ({ field: c, message: `${c} debe ser un número positivo` }));
}

export function validarDNI(dni: string): ValidationError[] {
  if (!/^\d{8}$/.test(dni)) {
    return [{ field: 'dni', message: 'DNI debe tener exactamente 8 dígitos numéricos' }];
  }
  return [];
}

export function validarPlaca(placa: string): ValidationError[] {
  if (!/^[A-Z0-9]{3}-?\d{3}$/.test(placa.toUpperCase())) {
    return [{ field: 'placa', message: 'Placa inválida (formato: ABC-123)' }];
  }
  return [];
}

export function formatearErrores(errores: ValidationError[]) {
  return {
    success: false,
    errors: errores,
    error: errores.map((e) => e.message).join(', '),
  };
}

export async function verificarDuplicado(
  supabase: any,
  tabla: string,
  campo: string,
  valor: string,
  excludeId?: number
): Promise<boolean> {
  let query = supabase
    .from(tabla)
    .select('id')
    .ilike(campo, valor.trim());

  if (excludeId) query = query.neq('id', excludeId);

  const { data } = await query;
  return data && data.length > 0;
}
