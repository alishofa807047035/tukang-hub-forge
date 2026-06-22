import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  type CartItemDTO,
} from "@/lib/cart.functions";
import { useAuth } from "./use-auth";

export function useCart() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const getCartFn = useServerFn(getCart);
  const addFn = useServerFn(addToCart);
  const updateFn = useServerFn(updateCartItem);
  const removeFn = useServerFn(removeCartItem);
  const clearFn = useServerFn(clearCart);

  const query = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: () => getCartFn(),
    enabled: !!user,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cart"] });

  const add = useMutation({
    mutationFn: (vars: { productId: string; qty: number }) => addFn({ data: vars }),
    onSuccess: () => {
      invalidate();
      toast.success("Ditambahkan ke keranjang");
    },
    onError: (e: any) => toast.error(e?.message ?? "Gagal menambahkan"),
  });
  const update = useMutation({
    mutationFn: (vars: { itemId: string; qty: number }) => updateFn({ data: vars }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (vars: { itemId: string }) => removeFn({ data: vars }),
    onSuccess: invalidate,
  });
  const clear = useMutation({
    mutationFn: () => clearFn(),
    onSuccess: invalidate,
  });

  const items: CartItemDTO[] = query.data?.items ?? [];
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return { items, count, subtotal, isLoading: query.isLoading, add, update, remove, clear };
}