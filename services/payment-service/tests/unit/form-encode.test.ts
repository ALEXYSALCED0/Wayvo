import { encodeForm } from '../../src/infrastructure/stripe/form-encode';

describe('encodeForm', () => {
  it('codifica anidados y arreglos con la notación de corchetes de Stripe', () => {
    const encoded = encodeForm({
      customer: 'cus_1',
      items: [{ price: 'price_1' }],
      expand: ['latest_invoice.confirmation_secret'],
      metadata: { userId: 'u 1' },
    });
    const decoded = decodeURIComponent(encoded);
    expect(decoded).toContain('customer=cus_1');
    expect(decoded).toContain('items[0][price]=price_1');
    expect(decoded).toContain('expand[0]=latest_invoice.confirmation_secret');
    expect(decoded).toContain('metadata[userId]=u 1');
  });

  it('omite valores undefined y null', () => {
    expect(encodeForm({ a: 'x', b: undefined, c: null })).toBe('a=x');
  });
});
