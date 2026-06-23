/** js/lib/validation.js — Browser ES module version */

const VALID_TYPES = ['lent', 'repaid'];
const MAX_PAISE = Number.MAX_SAFE_INTEGER;

export function validateTransactionInput({ amount_paise, type, date } = {}) {
  const errors = [];
  if (amount_paise === null || amount_paise === undefined) {
    errors.push('Amount is required.');
  } else {
    const n = Number(amount_paise);
    if (Number.isNaN(n))           errors.push('Amount must be a number.');
    else if (!Number.isInteger(n)) errors.push('Amount must be a whole number of paise.');
    else if (n <= 0)               errors.push('Amount must be greater than zero.');
    else if (n > MAX_PAISE)        errors.push('Amount exceeds maximum allowed value.');
  }
  if (!type)                       errors.push('Transaction type is required.');
  else if (!VALID_TYPES.includes(type)) errors.push(`Type must be "lent" or "repaid".`);
  if (!date)                       errors.push('Transaction date is required.');
  else {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) errors.push(`Invalid date: "${date}".`);
    else if (parsed.getTime() > Date.now() + 86400000) errors.push('Transaction date is in the future.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateCustomerInput({ name, phone, location, district, email, notes } = {}) {
  const errors = [];
  if (!name || name.trim() === '') errors.push('Customer name is required.');
  else if (name.trim().length > 200) errors.push('Name must be ≤200 characters.');
  if (phone && phone.trim()) {
    const stripped = phone.replace(/[\s\-().+]/g, '');
    if (!/^\d{7,15}$/.test(stripped)) errors.push('Phone must be 7–15 digits.');
  }
  if (email && email.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.push('Invalid email address.');
  }
  const normalisedDistrict = (district && district.trim()) ? district.trim() : 'Thiruvallur';
  return {
    valid: errors.length === 0,
    errors,
    normalised: {
      name: (name || '').trim(),
      phone: (phone || '').trim(),
      location: (location || '').trim(),
      district: normalisedDistrict,
      email: (email || '').trim(),
      notes: (notes || '').trim(),
    },
  };
}

export function isDuplicatePhone(phone, existingCustomers) {
  if (!phone || !existingCustomers?.length) return { isDuplicate: false, existingCustomers: [] };
  const n = phone.replace(/[\s\-().+]/g, '');
  const matches = existingCustomers.filter(c => {
    const cp = (c.phone || '').replace(/[\s\-().+]/g, '');
    return cp !== '' && cp === n;
  });
  return { isDuplicate: matches.length > 0, existingCustomers: matches };
}
