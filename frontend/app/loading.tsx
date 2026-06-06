export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-8xl px-4 py-5 sm:px-6 lg:px-10 xl:px-14">
      <div className="border-b border-line pb-5">
        <div className="h-8 w-48 animate-pulse rounded bg-stone-200" />
        <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-stone-200" />
      </div>
      <section className="mt-5 rounded-lg border border-line bg-white p-4 shadow-hairline">
        <div className="h-5 w-72 animate-pulse rounded bg-stone-200" />
        <div className="mt-4 grid gap-2">
          {Array.from({ length: 7 }).map((_, row) => (
            <div className="grid grid-cols-8 gap-2" key={row}>
              {Array.from({ length: 8 }).map((__, col) => (
                <div
                  className="h-8 animate-pulse rounded bg-stone-100"
                  key={`${row}-${col}`}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            className="h-32 animate-pulse rounded-lg border border-line bg-white shadow-hairline"
            key={index}
          />
        ))}
      </section>
    </main>
  );
}
