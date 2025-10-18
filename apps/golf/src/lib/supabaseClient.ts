import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined;
          return document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1];
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return;
          // Only set domain on production (inplay.tv), not localhost
          const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('inplay.tv');
          const cookieDomain = isProduction ? 'domain=.inplay.tv;' : '';
          document.cookie = `${name}=${value}; path=/; ${cookieDomain} ${options.maxAge ? `max-age=${options.maxAge};` : ''} ${options.sameSite ? `samesite=${options.sameSite};` : ''} ${options.secure ? 'secure;' : ''}`;
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return;
          const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('inplay.tv');
          const cookieDomain = isProduction ? 'domain=.inplay.tv;' : '';
          document.cookie = `${name}=; path=/; ${cookieDomain} max-age=0;`;
        },
      },
    }
  );
};
