'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * Escucha cambios en una o varias tablas de Supabase y llama a `onRefresh`
 * cuando ocurre un INSERT, UPDATE o DELETE. El componente puede usar onRefresh
 * para volver a cargar su data desde la API.
 */
export function useRealtimeRefresh(
  tables: string[],
  onRefresh: () => void,
  channelName: string,
) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const channel = supabase.channel(channelName);

    tables.forEach((table) => {
      channel.on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table },
        () => onRefreshRef.current(),
      );
    });

    channel.subscribe();

    return () => { channel.unsubscribe(); };
  }, [channelName, tables.join(',')]);
}
