import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { orderStore } from "@/lib/orders/store";
import { isExpired, publicOrder } from "@/lib/orders/service";
import { OrderView } from "./OrderView";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { paid?: string; error?: string };
}) {
  const order = await orderStore().get(params.id);
  if (!order) notFound();

  return (
    <OrderView
      order={publicOrder(order)}
      expired={isExpired(order)}
      justPaid={searchParams.paid === "1"}
      error={searchParams.error}
    />
  );
}
