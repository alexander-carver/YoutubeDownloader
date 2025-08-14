type AdPlaceholderProps = {
  label?: string;
  size?: string;
  className?: string;
  sticky?: boolean;
  desktopOnly?: boolean;
};

export default function AdPlaceholder({
  label = "Advertisement Space",
  size = "",
  className = "",
  sticky = false,
  desktopOnly = false,
}: AdPlaceholderProps) {
  return (
    <aside
      className={[
        "rounded-xl border border-dashed border-black/15",
        "bg-foreground/5",
        "p-6 text-center",
        "[&_*]:select-none",
        "[&_small]:text-foreground/60",
        "[&_small]:block",
        "[&_button]:text-xs",
        "[&_button]:mt-3",
        "[&_button]:rounded-md",
        "[&_button]:border",
        "[&_button]:border-black/10",
        sticky ? "sticky top-24" : "",
        desktopOnly ? "hidden lg:block" : "",
        className,
      ].join(" ")}
      aria-label={label}
    >
      <div className="mx-auto flex h-64 w-full max-w-[300px] items-center justify-center">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-foreground/40"
        >
          <path d="M3 11h18M7 7h10M5 15h14" />
        </svg>
      </div>
      <div className="text-sm font-medium">{label} <span aria-hidden>📣</span></div>
      {size && <small className="mt-1">{size}</small>}
      {sticky && <button className="px-3 py-1">Sticky Positioned <span aria-hidden>📌</span></button>}
      {desktopOnly && <button className="ml-2 px-3 py-1">Desktop Only <span aria-hidden>🖥️</span></button>}
    </aside>
  );
}


