import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { repositories } from '@/repositories'

const KEY = ['favourites']

/** Optimistic shortlist with rollback on failure (spec FAV-01). */
export function useFavourites() {
  const qc = useQueryClient()
  const { data: ids = [] } = useQuery({
    queryKey: KEY,
    queryFn: () => repositories.favourites.ids(),
  })

  const mutation = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      if (next) await repositories.favourites.add(id)
      else await repositories.favourites.remove(id)
    },
    onMutate: async ({ id, next }) => {
      await qc.cancelQueries({ queryKey: KEY })
      const prev = qc.getQueryData<string[]>(KEY) ?? []
      const optimistic = next ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)
      qc.setQueryData(KEY, optimistic)
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev) // rollback
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  })

  return {
    ids,
    isFavourite: (id: string) => ids.includes(id),
    toggle: (id: string) => mutation.mutate({ id, next: !ids.includes(id) }),
    count: ids.length,
  }
}
