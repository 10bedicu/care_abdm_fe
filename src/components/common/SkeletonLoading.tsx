import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors care_fe's `TableSkeleton`. */
export function TableSkeleton({
  count,
  columns = 5,
}: {
  count: number;
  columns?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="min-w-full divide-y divide-border">
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, column) => (
              <th key={column} className="bg-soft-background px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="animate-pulse divide-y divide-border bg-background">
          {Array.from({ length: count }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }, (_, column) => (
                <td key={column} className="px-4 py-4">
                  <Skeleton className="mb-1 h-4 w-24" />
                  {column < 2 && <Skeleton className="h-3 w-16" />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Stacked placeholder cards for lists that render as cards. */
export function CardListSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse flex-col gap-3 rounded-lg border border-border bg-card p-4"
        >
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
