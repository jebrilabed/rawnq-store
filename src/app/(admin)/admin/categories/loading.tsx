import { AdminTableSkeleton } from "@/components/ui/Skeleton";

export default function AdminCategoriesLoading() {
  return (
    <div>
      <div style={{ height: 60, marginBottom: 20 }} />
      <AdminTableSkeleton rows={6} />
    </div>
  );
}
