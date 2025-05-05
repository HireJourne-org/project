// Type declarations for Deno modules used in Supabase Edge Functions
declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module 'npm:@supabase/supabase-js@2.39.7' {
  export * from '@supabase/supabase-js';
}

// Deno global namespace
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

// EdgeRuntime global
declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
}; 