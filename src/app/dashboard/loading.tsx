import { Skeleton, SkeletonTable } from "@/components/ui/LoadingState";

/**
 * Dashboard loading skeleton — mirrors the real three-column workspace so the
 * transition into loaded content is seamless (spec §40).
 */
export default function DashboardLoading() {
  return (
    <div className="relative min-h-screen pb-20 pt-[104px] sm:pt-[124px]">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 border-b border-border-subtle pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full max-w-md">
            <Skeleton className="mb-3 h-6 w-28 rounded-full" />
            <Skeleton className="mb-3 h-7 w-64" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex gap-2.5">
            <Skeleton className="h-[46px] w-28 rounded-[12px]" />
            <Skeleton className="h-[46px] w-28 rounded-[12px]" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 lg:gap-7">
          <div className="lg:col-span-3">
            <div className="mat-2 rounded-[18px] p-5">
              <Skeleton className="mb-4 h-12 w-12 rounded-[14px]" />
              <Skeleton className="mb-3 h-4 w-32" />
              <Skeleton className="mb-3 h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>

          <div className="space-y-5 lg:col-span-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-[220px] w-full rounded-[18px]" />
            <Skeleton className="h-[180px] w-full rounded-[18px]" />
          </div>

          <div className="lg:col-span-3">
            <div className="mat-2 rounded-[18px] p-5">
              <SkeletonTable rows={3} cols={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
