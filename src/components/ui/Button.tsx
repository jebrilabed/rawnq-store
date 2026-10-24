"use client";

import React from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/LoadingState";

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function LoadingButton({
  loading = false,
  loadingText,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: LoadingButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      className={className}
      disabled={isDisabled}
      aria-busy={loading}
    >
      {loading ? (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <Spinner />
          {loadingText || children}
        </span>
      ) : (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          {icon}
          {children}
        </span>
      )}
    </button>
  );
}

export interface FormSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pendingLabel?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function FormSubmitButton({
  pendingLabel,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      {...props}
      type="submit"
      className={className}
      disabled={isDisabled}
      aria-busy={pending}
    >
      {pending ? (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <Spinner />
          {pendingLabel || children}
        </span>
      ) : (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          {icon}
          {children}
        </span>
      )}
    </button>
  );
}
