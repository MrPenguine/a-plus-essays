import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - A+ Essays",
  description: "Your A+ Essays Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="pt-[80px]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        
        {/* Dashboard Content */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Active Orders</h2>
            <p className="mt-2 text-4xl font-bold">0</p>
          </div>
          
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Completed Orders</h2>
            <p className="mt-2 text-4xl font-bold">0</p>
          </div>
          
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Total Spent</h2>
            <p className="mt-2 text-4xl font-bold">$0</p>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-foreground">Recent Orders</h2>
          <div className="mt-4 rounded-lg border bg-card p-6">
            <p className="text-center text-muted-foreground">No orders yet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
