import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        ORDER_STATUS_COLOR[status],
      )}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}