import { redirect } from "next/navigation";

export default function AdminLogin() {
  redirect("/ar/login?next=admin");
}