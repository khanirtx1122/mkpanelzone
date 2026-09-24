import { Skeleton, SkeletonCard } from "@/components/ui/LoadingState";

/** Products route skeleton — matches the real header + grid rhythm. */
export default function ProductsLoading() {
  return (
    <div className="relative min-h-screen pb-24 pt-[104px] sm:pt-[124px]">
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6">
        <Skeleton className="mb-8 h-3 w-40" />

        <div className="mb-12 flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div className="w-full max-w-2xl">
            <Skeleton className="mb-4 h-3 w-24" />
            <Skeleton className="mb-5 h-12 w-72" />
            <Skeleton className="mb-3 h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <Skeleton className="h-[86px] w-[150px] rounded-[14px]" />
        </div>

        <Skeleton className="mb-10 h-[58px] w-full rounded-[14px]" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      </div>
    </div>
  );
}
