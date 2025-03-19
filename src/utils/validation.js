// src/utils/validation.js
export function checkDuplicate(items, newItem, idField = 'id', checkFields = ['code']) {
  return checkFields.some(field =>
    items.some(item => item[field] === newItem[field] && item[idField] !== newItem[idField])
  );
}