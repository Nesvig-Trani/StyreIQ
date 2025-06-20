import { Card, CardContent, CardHeader } from '@/shared'
import { Skeleton } from '@/shared/components/ui/skeleton'

export default function Loading() {
  return (
    <div>
      <div className="p-4 border-b space-y-3">
        <div className="flex justify-end">
          <Skeleton className="h-8 w-[180px] pl-10 bg-gray-400" />
        </div>
      </div>

      <div className="flex h-full">
        <div className="w-1/2 border-r flex flex-col">
          <div className="flex-1 p-2 space-y-2">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-[150px] bg-gray-400" />
                    <Skeleton className="h-4 w-[200px] bg-gray-400" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="w-1/2 flex flex-col">
          <Card className="h-full m-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-[200px] bg-gray-400" />
                <Skeleton className="h-4 w-[150px] bg-gray-400" />
              </div>
              <Skeleton className="h-9 w-9 rounded-md bg-gray-400" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-[100px] bg-gray-400" />
                  <Skeleton className="h-4 w-full bg-gray-400" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
