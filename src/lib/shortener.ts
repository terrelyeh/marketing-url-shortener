import { nanoid } from 'nanoid';

export const COMPACT_SIZE = 6;
// Custom alphabet for cleaner URLs (no look-alike characters like 0/O, 1/l/I) is optional but good.
// NanoID default is url-safe.

const RESERVED_ALIASES = [
    'api',
    'auth',
    'dashboard',
    'login',
    'logout',
    'register',
    'signin',
    'signout',
    'settings',
    'admin',
    'static',
    'public',
    '404',
    '500',
];

/**
 * Generate a random short code.
 * @param size Length of the code (default: 6)
 */
export function generateShortCode(size: number = COMPACT_SIZE): string {
    return nanoid(size);
}

/**
 * Check if an alias is valid (format) and not reserved.
 * @param alias The alias to check
 */
export function isValidAliasFormat(alias: string): { valid: boolean; error?: string } {
    if (!alias) return { valid: false, error: 'Alias cannot be empty' };

    if (alias.length < 3) return { valid: false, error: 'Alias must be at least 3 characters' };

    if (alias.length > 50) return { valid: false, error: 'Alias is too long' };

    // Only alphanumeric, hyphens, and underscores
    const regex = /^[a-zA-Z0-9-_]+$/;
    if (!regex.test(alias)) {
        return { valid: false, error: 'Alias can only contain letters, numbers, hyphens, and underscores' };
    }

    if (RESERVED_ALIASES.includes(alias.toLowerCase())) {
        return { valid: false, error: 'This alias is reserved by the system' };
    }

    return { valid: true };
}
