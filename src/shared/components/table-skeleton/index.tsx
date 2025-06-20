import { Skeleton } from '../ui/skeleton'

export function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Skeleton className="h-10 w-[150px] bg-gray-400" />
      </div>

      <div className="rounded-md border">
        <div className="space-y-4 p-4">
          {[...Array(5)].map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, colIndex) => (
                <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-8 w-full bg-gray-400" />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end">
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-10 bg-gray-400" />
          <Skeleton className="h-10 w-10 bg-gray-400" />
          <Skeleton className="h-10 w-10 bg-gray-400" />
        </div>
      </div>
    </div>
  )
}
