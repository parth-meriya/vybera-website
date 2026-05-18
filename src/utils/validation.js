/**
 * VYBERA — Shared Validation Utilities
 *
 * Centralized validation logic used across signup, checkout,
 * and server-side endpoints. Every rule is defined once here.
 */

// ── Name Validation ───────────────────────────────────────────
export const NAME_REGEX = /^[A-Za-z ]+$/;

export const validateName = (name) => {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'Full name is required';
  if (!NAME_REGEX.test(trimmed)) return 'Name can contain only letters';
  if (trimmed.length < 2) return 'Name must be at least 2 characters';
  return '';
};

// ── Email Validation ──────────────────────────────────────────
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email) => {
  const trimmed = (email || '').trim();
  if (!trimmed) return 'Email is required';
  if (!EMAIL_REGEX.test(trimmed)) return 'Please enter a valid email address';
  return '';
};

// ── Phone Validation (Indian mobile) ──────────────────────────
export const PHONE_REGEX = /^[6-9]\d{9}$/;

export const validatePhone = (phone) => {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return 'Mobile number is required';
  if (digits.length !== 10) return 'Mobile number must be exactly 10 digits';
  if (!PHONE_REGEX.test(digits)) return 'Enter a valid Indian mobile number (starts with 6-9)';
  return '';
};

// ── Password Validation ──────────────────────────────────────
export const PASSWORD_RULES = [
  { label: '8+ characters', test: (p) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Number', test: (p) => /[0-9]/.test(p) },
  { label: 'Special character (!@#$…)', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

export const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('a number');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) errors.push('a special character');
  return errors;
};

export const validatePasswordNotEmail = (password, email) => {
  if (!password || !email) return '';
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim().toLowerCase();
  if (cleanPassword === cleanEmail) return 'Password cannot be same as email';
  // Also check if password contains the email local part
  const localPart = cleanEmail.split('@')[0];
  if (localPart.length >= 4 && cleanPassword.includes(localPart)) {
    return 'Password should not contain your email username';
  }
  return '';
};

// ── Input Sanitization ────────────────────────────────────────
export const sanitizeInput = (value) => {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[<>]/g, '')     // Strip HTML brackets
    .replace(/javascript:/gi, '') // Strip JS protocol
    .trim();
};

export const sanitizePhone = (value) => {
  return (value || '').replace(/\D/g, '').slice(0, 10);
};

export const sanitizeName = (value) => {
  // Only allow letters and spaces
  return (value || '').replace(/[^A-Za-z ]/g, '');
};
