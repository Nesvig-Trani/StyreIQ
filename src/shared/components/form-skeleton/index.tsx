import { Skeleton } from '../ui/skeleton'

export function FormSkeleton() {
  return (
    <div className="flex justify-center">
      <div className="space-y-8 w-1/2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px] bg-gray-400" />
          <Skeleton className="h-5 w-[300px] bg-gray-400" />
        </div>

        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-[100px] bg-gray-400" />
              <Skeleton className="h-10 w-full bg-gray-400" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Skeleton className="h-10 w-full bg-gray-400" />
        </div>
      </div>
    </div>
  )
}
