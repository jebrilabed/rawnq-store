import { AdminTableSkeleton } from "@/components/ui/Skeleton";

export default function AdminOrdersLoading() {
  return (
    <div>
      <div style={{ height: 60, marginBottom: 20 }} />
      <AdminTableSkeleton rows={6} />
    </div>
  );
}
