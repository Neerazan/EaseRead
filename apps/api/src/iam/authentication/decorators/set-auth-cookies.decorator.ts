import { SetMetadata } from '@nestjs/common';

export const SET_AUTH_COOKIES_KEY = 'set_auth_cookies';
export const SetAuthCookies = () => SetMetadata(SET_AUTH_COOKIES_KEY, true);
