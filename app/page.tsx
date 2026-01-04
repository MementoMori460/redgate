import { getSales } from "./actions/sales";
import { getSetting } from "./actions/settings";
import { DashboardClient } from "./components/DashboardClient";
import { auth } from "@/auth";

import { checkLateShipments } from "./utils/notifications";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const sales = await getSales();
  const session = await auth();
  const targetRevenueStr = await getSetting('TARGET_REVENUE');
  const targetRevenue = targetRevenueStr ? parseFloat(targetRevenueStr) : 775000;

  const lateShipmentCount = await checkLateShipments();

  // Filter sales for SALES personnel
  const filteredSales = (session?.user?.role === 'SALES' || session?.user?.role === 'sales')
    ? sales.filter(sale => sale.salesPerson === session.user?.name)
    : sales;

  return <DashboardClient sales={filteredSales} user={session?.user} targetRevenue={targetRevenue} lateShipmentCount={lateShipmentCount} />;
}

