/** Placeholder with the workspace's layout, shown instantly during client navigation. */
export function WorkspaceSkeleton() {
  const bar = "animate-pulse rounded bg-muted";
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-hidden="true">
      <div className="flex h-11 shrink-0 items-center border-b border-line bg-surface px-4">
        <div className={`${bar} h-3.5 w-56`} />
      </div>
      <div className="flex h-11 border-b border-line bg-surface lg:hidden" />
      <div className="flex min-h-0 flex-1">
        <div className="flex w-full flex-col gap-4 bg-surface p-6 lg:w-[32%] lg:border-r lg:border-line">
          <div className={`${bar} h-3 w-40`} />
          <div className={`${bar} h-6 w-64`} />
          <div className={`${bar} h-3 w-full`} />
          <div className={`${bar} h-3 w-5/6`} />
          <div className={`${bar} mt-4 h-40 w-full rounded-lg`} />
        </div>
        <div className="hidden min-w-0 flex-1 flex-col bg-editor lg:flex">
          <div className="h-11 border-b border-line bg-surface" />
        </div>
        <div className="hidden w-[28%] border-l border-line bg-surface lg:block" />
      </div>
    </div>
  );
}
