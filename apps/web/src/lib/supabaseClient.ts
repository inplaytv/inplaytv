import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1];
        },
        set(name: string, value: string, options: any) {
          document.cookie = `${name}=${value}; path=/; domain=.inplay.tv; ${options.maxAge ? `max-age=${options.maxAge};` : ''} ${options.sameSite ? `samesite=${options.sameSite};` : ''} ${options.secure ? 'secure;' : ''}`;
        },
        remove(name: string, options: any) {
          document.cookie = `${name}=; path=/; domain=.inplay.tv; max-age=0;`;
        },
      },
    }
  );
