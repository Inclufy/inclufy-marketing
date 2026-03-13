import { useEffect } from 'react';
import seedService from '@/services/context-marketing/seed.service';

export function useSeedData() {
  useEffect(() => {
    seedService.seedIfEmpty().catch(console.error);
  }, []);
}
