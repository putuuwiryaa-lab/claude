type PoltarRowProps = {
  label: string;
  value: string;
};

export function PoltarRow({ label, value }: PoltarRowProps) {
  const digits = value.split(" ").filter(Boolean);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">{label}</div>
        <div className="text-xs text-slate-500">kuat ke lemah</div>
      </div>
      <div className="grid grid-cols-10 gap-2">
        {digits.map((digit, index) => (
          <div
            key={`${label}-${digit}-${index}`}
            className="flex aspect-square items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 text-lg font-black text-white"
            title={`Rank ${index + 1}`}
          >
            {digit}
          </div>
        ))}
      </div>
    </div>
  );
}
