"use client";

export default function DemoError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8">
      <h1 className="text-lg font-semibold">The workspace hit an error</h1>
      <p className="mt-2 text-sm text-muted-foreground">The saved demo was not changed. Try the view again.</p>
      <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={reset} type="button">
        Retry
      </button>
    </div>
  );
}
