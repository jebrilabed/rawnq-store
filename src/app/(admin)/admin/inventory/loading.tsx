import { AdminTableSkeleton } from "@/components/ui/Skeleton";

export default function AdminInventoryLoading() {
  return (
    <div>
      <div style={{ height: 60, marginBottom: 20 }} />
      <AdminTableSkeleton rows={8} />
    </div>
  );
}
