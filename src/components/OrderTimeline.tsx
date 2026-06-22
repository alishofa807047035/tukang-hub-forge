import { Check, X } from "lucide-react";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";

interface HistoryItem { status: string; notes: string | null; created_at: string }

export function OrderTimeline({ status, history = [] }: { status: OrderStatus; history?: HistoryItem[] }) {
  const terminal = status === "ditolak" || status === "dibatalkan";
  if (terminal) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground"><X className="h-4 w-4" /></span>
          <div>
            <p className="font-semibold text-destructive">{ORDER_STATUS_LABEL[status]}</p>
            {history.find((h) => h.status === status)?.notes && <p className="text-sm text-muted-foreground">{history.find((h) => h.status === status)?.notes}</p>}
          </div>
        </div>
      </div>
    );
  }
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);
  return (
    <ol className="relative space-y-6">
      {ORDER_STATUS_FLOW.map((s, i) => {
        const done = i <= currentIndex;
        const active = i === currentIndex;
        const h = history.find((x) => x.status === s);
        return (
          <li key={s} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>
                {done ? <Check className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
              </span>
              {i < ORDER_STATUS_FLOW.length - 1 && <span className={`mt-1 h-8 w-0.5 ${i < currentIndex ? "bg-primary" : "bg-border"}`} />}
            </div>
            <div className="pt-1">
              <p className={`font-semibold ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>{ORDER_STATUS_LABEL[s]}</p>
              {h && <p className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}{h.notes ? ` — ${h.notes}` : ""}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}