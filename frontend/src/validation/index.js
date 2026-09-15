export function required(value, message = 'This field is required') {
  if (value === undefined || value === null) return message;
  if (typeof value === 'string' && value.trim() === '') return message;
  return null;
}

export function email(value, message = 'Enter a valid email') {
  if (!value) return null;
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(String(value).trim()) ? null : message;
}

export function minLength(value, min, message) {
  if (!value) return null;
  const len = String(value).length;
  return len >= min ? null : message || `Must be at least ${min} characters`;
}

export function positiveNumber(value, message = 'Must be a positive number') {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0) return message;
  return null;
}

export function futureDate(value, message = 'Date must be today or in the future') {
  if (!value) return null;
  const input = new Date(value);
  if (Number.isNaN(input.getTime())) return 'Enter a valid date';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  input.setHours(0, 0, 0, 0);
  return input >= today ? null : message;
}

export function validate(fields) {
  const errors = {};
  Object.entries(fields).forEach(([key, rules]) => {
    for (const rule of rules) {
      const result = typeof rule === 'function' ? rule() : rule;
      if (result) {
        errors[key] = result;
        break;
      }
    }
  });
  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
