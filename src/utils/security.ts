/**
 * Módulo de seguridad, sanitización y validación estricta de inputs
 * Previene SQL Injection, XSS y datos malformados en frontend
 */

// Patrones comunes de SQL Injection
const SQLI_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|UNION|MERGE)\b)/i,
  /(--|\/\*|\*\/|;|xp_|sp_|0x[0-9a-f]+)/i,
  /('|\b)(OR|AND)\b.+(=|<|>|LIKE|IN)\b/i,
  /['"`;\\]/,
];

// Patrones comunes de XSS
const XSS_PATTERNS = [
  /<[^>]*>/i,
  /javascript\s*:/i,
  /data\s*:\s*text\/html/i,
  /on\w+\s*=/i,
];

/**
 * Comprueba si un string contiene patrones evidentes de SQL Injection
 */
export function containsSQLInjection(input: string): boolean {
  if (!input) return false;
  return SQLI_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Comprueba si un string contiene patrones de XSS
 */
export function containsXSS(input: string): boolean {
  if (!input) return false;
  return XSS_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Sanitiza un texto eliminando caracteres peligrosos de SQLi y scripts
 */
export function sanitizeText(input: string, maxLength: number = 200): string {
  if (!input) return '';
  return input
    .slice(0, maxLength)
    // Elimina tags HTML
    .replace(/<[^>]*>?/gm, '')
    // Elimina caracteres peligrosos comunes en SQLi/XSS: quotes, semicolons, backslashes, backticks, dollar signs
    .replace(/['"`;\\\$<>{}\[\]]/g, '')
    // Reemplaza secuencias de comentarios SQL
    .replace(/--+/g, '-')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Normaliza espacios en blanco
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitiza texto de búsqueda en tiempo real
 */
export function sanitizeSearchQuery(input: string, maxLength: number = 60): string {
  if (!input) return '';
  return input
    .slice(0, maxLength)
    .replace(/['"`;\\\$<>{}\[\]]/g, '')
    .replace(/--+/g, '')
    .trimStart();
}

/**
 * Valida un nombre de entidad (ingrediente, receta, persona)
 * Permite letras (incluyendo acentos y ñ), números, espacios, guiones y paréntesis básicos
 */
export function validateName(
  input: string,
  fieldName: string = 'Nombre',
  minLength: number = 2,
  maxLength: number = 80
): { isValid: boolean; error?: string; cleanValue: string } {
  const clean = sanitizeText(input, maxLength);

  if (!clean || clean.length < minLength) {
    return {
      isValid: false,
      error: `El ${fieldName} debe tener al menos ${minLength} caracteres`,
      cleanValue: clean,
    };
  }

  if (clean.length > maxLength) {
    return {
      isValid: false,
      error: `El ${fieldName} no puede exceder los ${maxLength} caracteres`,
      cleanValue: clean,
    };
  }

  // Verificar caracteres sospechosos de inyección
  if (containsSQLInjection(input) || containsXSS(input)) {
    return {
      isValid: false,
      error: `El ${fieldName} contiene caracteres o patrones no permitidos`,
      cleanValue: clean,
    };
  }

  // Permitir sólo caracteres alfanuméricos en español, espacios y puntuación básica
  const validNameRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\-().,]+$/;
  if (!validNameRegex.test(clean)) {
    return {
      isValid: false,
      error: `El ${fieldName} contiene caracteres especiales no válidos`,
      cleanValue: clean,
    };
  }

  return { isValid: true, cleanValue: clean };
}

/**
 * Valida descripciones de recetas o notas
 */
export function validateDescription(
  input: string,
  maxLength: number = 300
): { isValid: boolean; error?: string; cleanValue: string } {
  if (!input || input.trim() === '') {
    return { isValid: true, cleanValue: '' };
  }

  const clean = sanitizeText(input, maxLength);

  if (clean.length > maxLength) {
    return {
      isValid: false,
      error: `La descripción no puede exceder los ${maxLength} caracteres`,
      cleanValue: clean,
    };
  }

  if (containsSQLInjection(input) || containsXSS(input)) {
    return {
      isValid: false,
      error: 'La descripción contiene expresiones no permitidas por seguridad',
      cleanValue: clean,
    };
  }

  return { isValid: true, cleanValue: clean };
}

/**
 * Valida una cantidad entera positiva
 */
export function validateQuantity(
  input: string | number,
  min: number = 1,
  max: number = 100000,
  fieldName: string = 'La cantidad'
): { isValid: boolean; error?: string; cleanNumber: number } {
  const strVal = String(input).trim();

  // Validar formato numérico estricto (solo dígitos enteros positivos)
  if (!/^\d+$/.test(strVal)) {
    return {
      isValid: false,
      error: `${fieldName} debe ser un número entero positivo sin decimales ni símbolos`,
      cleanNumber: 0,
    };
  }

  const num = parseInt(strVal, 10);

  if (isNaN(num)) {
    return {
      isValid: false,
      error: `${fieldName} no es un número válido`,
      cleanNumber: 0,
    };
  }

  if (num < min) {
    return {
      isValid: false,
      error: `${fieldName} debe ser al menos ${min}`,
      cleanNumber: num,
    };
  }

  if (num > max) {
    return {
      isValid: false,
      error: `${fieldName} no puede ser superior a ${max.toLocaleString('es-ES')}`,
      cleanNumber: num,
    };
  }

  return { isValid: true, cleanNumber: num };
}

/**
 * Valida la unidad de medida contra la lista blanca oficial
 */
export function validateUnitOfMeasure(unit: string): { isValid: boolean; error?: string; cleanUnit: string } {
  const allowedUnits = ['MILILITROS', 'GRAMOS', 'UNIDADES'];
  const clean = String(unit || '').trim().toUpperCase();

  if (!allowedUnits.includes(clean)) {
    return {
      isValid: false,
      error: 'Debe seleccionar una unidad de medida válida (Mililitros, Gramos o Unidades)',
      cleanUnit: '',
    };
  }

  return { isValid: true, cleanUnit: clean };
}

/**
 * Valida formato de correo electrónico
 */
export function validateEmail(email: string): { isValid: boolean; error?: string; cleanEmail: string } {
  const clean = String(email || '').trim().toLowerCase();

  if (!clean) {
    return { isValid: false, error: 'El correo electrónico es requerido', cleanEmail: '' };
  }

  if (clean.length > 100) {
    return { isValid: false, error: 'El correo electrónico es demasiado largo', cleanEmail: clean };
  }

  if (containsSQLInjection(clean) || containsXSS(clean)) {
    return { isValid: false, error: 'El correo electrónico contiene caracteres no válidos', cleanEmail: '' };
  }

  // Regex RFC 5322 simplificado
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return { isValid: false, error: 'Ingresa un correo electrónico con formato válido (ej: usuario@correo.com)', cleanEmail: clean };
  }

  return { isValid: true, cleanEmail: clean };
}

/**
 * Valida contraseña
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'La contraseña es requerida' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'La contraseña no puede exceder los 128 caracteres' };
  }

  return { isValid: true };
}
