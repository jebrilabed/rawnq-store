"use client";

import { Printer, MessageCircle } from "lucide-react";
import s from "./admin.module.css";

export function formatWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("00972")) return digits.slice(2);
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("05")) return "972" + digits.slice(1);
  if (digits.startsWith("5") && digits.length === 9) return "972" + digits;
  return digits;
}

export function PrintOrderButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className || s.btnGhost}
      onClick={() => window.print()}
      title="طباعة الفاتورة / سند الإرسالية"
    >
      <Printer size={16} aria-hidden="true" />
      <span>طباعة الفاتورة</span>
    </button>
  );
}

export function WhatsAppCustomerButton({
  phone,
  customerName,
  orderNumber,
  total,
  label = "مراسلة واتساب",
  size = "md",
}: {
  phone: string;
  customerName?: string;
  orderNumber: string;
  total?: number;
  label?: string;
  size?: "sm" | "md";
}) {
  const formattedPhone = formatWhatsAppPhone(phone);
  if (!formattedPhone) return null;

  const greeting = customerName ? `مرحباً ${customerName}، ` : "مرحباً، ";
  const totalText = total ? ` بقيمة ${total} ₪` : "";
  const defaultMessage = `${greeting}معك متجر رونق بخصوص طلبك رقم #${orderNumber}${totalText}.`;
  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={size === "sm" ? s.sm : s.btnGhost}
      style={{
        color: "#15803d",
        borderColor: "#bbf7d0",
        backgroundColor: "#f0fdf4",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
      }}
      title={`مراسلة ${customerName || "العميل"} على واتساب`}
    >
      <MessageCircle size={size === "sm" ? 14 : 16} aria-hidden="true" />
      <span>{label}</span>
    </a>
  );
}
