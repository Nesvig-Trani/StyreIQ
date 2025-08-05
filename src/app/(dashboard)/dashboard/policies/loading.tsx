import { Skeleton } from '@/shared/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="bg-white p-4">
      <div className="flex justify-end mb-2">
        <Skeleton className="h-8 w-32 bg-gray-400" />
      </div>
      <div className="flex justify-end items-center gap-2 mb-2">
        <Skeleton className="h-8 w-32 bg-gray-400" />
        <Skeleton className="h-8 w-32 bg-gray-400" />
      </div>
      <Skeleton className="h-52 bg-gray-400" />
    </div>
  )
}
