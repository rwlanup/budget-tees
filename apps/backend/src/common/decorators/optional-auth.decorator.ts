import { SetMetadata } from '@nestjs/common';

export const OPTIONAL_AUTH_KEY = 'optionalAuth';

/**
 * Authenticate if a valid token is present, but allow the request through
 * without one (req.user stays undefined). For guest-capable routes (cart).
 */
export const OptionalAuth = () => SetMetadata(OPTIONAL_AUTH_KEY, true);
