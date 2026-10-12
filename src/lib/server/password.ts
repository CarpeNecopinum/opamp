import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
	password: string,
	salt: Buffer,
	keylen: number
) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

/**
 * Hashes a password with scrypt (from `node:crypto`, no extra dependency).
 * Stored format: `scrypt:<base64 salt>:<base64 hash>`.
 */
export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(SALT_BYTES);
	const hash = await scryptAsync(password, salt, KEY_LENGTH);
	return `scrypt:${salt.toString('base64')}:${hash.toString('base64')}`;
}

/** Constant-time password verification against a stored `scrypt:...` hash. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [scheme, saltB64, hashB64] = stored.split(':');
	if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;

	const salt = Buffer.from(saltB64, 'base64');
	const expected = Buffer.from(hashB64, 'base64');
	const actual = await scryptAsync(password, salt, expected.length);

	return timingSafeEqual(actual, expected);
}
