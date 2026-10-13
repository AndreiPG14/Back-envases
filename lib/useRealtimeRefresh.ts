'use client';

import { useEffect, useRef } from 'react';

export function useRealtimeRefresh(
  tables: string[],
  onRefresh: () => void,
  channelName: string,
  intervalMs: number = 10000,
) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const id = setInterval(() => onRefreshRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [channelName, tables.join(','), intervalMs]);
}
