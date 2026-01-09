"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Creates a Supabase client for use in Client Components.
 * 
 * This client automatically handles session management in the browser.
 * Use this for client-side data fetching and real-time subscriptions.
 * 
 * @example
 * ```tsx
 * "use client";
 * 
 * import { createClient } from '@/utils/supabase/client';
 * import { useEffect, useState } from 'react';
 * 
 * export function RealtimeComponent() {
 *   const [data, setData] = useState([]);
 *   const supabase = createClient();
 * 
 *   useEffect(() => {
 *     const channel = supabase
 *       .channel('realtime')
 *       .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, 
 *         (payload) => console.log(payload)
 *       )
 *       .subscribe();
 * 
 *     return () => { supabase.removeChannel(channel); };
 *   }, []);
 * 
 *   return <div>{JSON.stringify(data)}</div>;
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  );
}
