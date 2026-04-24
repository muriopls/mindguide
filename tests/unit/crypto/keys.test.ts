import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto/keys';

const TEST_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

describe('encryptApiKey / decryptApiKey', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  afterAll(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it('roundtrip: decrypts to original plaintext', () => {
    const original = 'sk-ant-test-key-12345';
    expect(decryptApiKey(encryptApiKey(original))).toBe(original);
  });

  it('roundtrip works for OpenAI key format', () => {
    const original = 'sk-proj-abcdefghijklmnop';
    expect(decryptApiKey(encryptApiKey(original))).toBe(original);
  });

  it('produces different ciphertext each call (random IV)', () => {
    const a = encryptApiKey('same-plaintext');
    const b = encryptApiKey('same-plaintext');
    expect(a).not.toBe(b);
  });

  it('stored format contains three colon-separated hex segments', () => {
    const stored = encryptApiKey('test');
    const parts = stored.split(':');
    expect(parts).toHaveLength(3);
    expect(parts.every((p) => /^[0-9a-f]+$/i.test(p))).toBe(true);
  });

  it('throws on malformed stored value (missing segments)', () => {
    expect(() => decryptApiKey('badinput')).toThrow('Invalid encrypted key format');
  });

  it('throws when ENCRYPTION_KEY env var is missing', () => {
    const saved = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encryptApiKey('test')).toThrow('ENCRYPTION_KEY');
    process.env.ENCRYPTION_KEY = saved;
  });

  it('throws when ENCRYPTION_KEY is wrong length', () => {
    process.env.ENCRYPTION_KEY = 'tooshort';
    expect(() => encryptApiKey('test')).toThrow('32 bytes');
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  it('throws on tampered ciphertext (auth tag mismatch)', () => {
    const stored = encryptApiKey('original');
    const [iv, tag, data] = stored.split(':');
    const tampered = `${iv}:${tag}:${'ff'.repeat(data.length / 2)}`;
    expect(() => decryptApiKey(tampered)).toThrow();
  });
});
