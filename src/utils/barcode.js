export function generateEAN13() {
  const prefix = '690'; // 示例前缀，可根据需求调整
  const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  const code = prefix + random;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit;
}