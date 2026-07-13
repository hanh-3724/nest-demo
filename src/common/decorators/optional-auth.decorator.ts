import { SetMetadata } from '@nestjs/common';

export const IS_OPTIONAL_AUTH_ROUTE = 'isOptionalAuthRoute';

export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_ROUTE, true);
