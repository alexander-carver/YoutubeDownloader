type AffiliateCardProps = {
  title: string;
  subtitle?: string;
};

export default function AffiliateCard({ title, subtitle = "Affiliate Link Placeholder" }: AffiliateCardProps) {
  return (
    <div className="rounded-xl border border-dashed border-black/15 bg-foreground/5 p-6 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-background">
        <span className="text-xl" aria-hidden>
          🎯
        </span>
      </div>
      <div className="text-base font-medium">{title}</div>
      <div className="mt-1 text-sm text-foreground/60">{subtitle}</div>
      <div className="mx-auto mt-3 inline-flex items-center rounded-md border border-black/10 px-3 py-1 text-xs text-foreground/70">
        Revenue Opportunity
      </div>
    </div>
  );
}


