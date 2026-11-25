// Stripe recibe application/x-www-form-urlencoded con corchetes para lo anidado:
//   { items: [{ price: 'p' }], metadata: { userId: 'u' } }  ->  items[0][price]=p&metadata[userId]=u
export function encodeForm(data: Record<string, unknown>): string {
  const pairs: string[] = [];
  const walk = (key: string, value: unknown): void => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(`${key}[${index}]`, item));
    } else if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) walk(`${key}[${k}]`, v);
    } else {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  };
  for (const [k, v] of Object.entries(data)) walk(k, v);
  return pairs.join('&');
}
