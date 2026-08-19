import { useQuery } from '@tanstack/react-query'
import { hasCapability, type Capability } from '@/services/supabase/capabilities'

/**
 * `true` only once the backend has been confirmed able to serve the feature.
 *
 * Undefined while the probe is in flight, so callers can render nothing rather
 * than flashing a control that may be about to disappear.
 */
export function useCapability(cap: Capability): boolean | undefined {
  const { data } = useQuery({
    queryKey: ['capability', cap],
    queryFn: () => hasCapability(cap),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
  return data
}
