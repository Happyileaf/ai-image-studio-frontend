"use client";

import { useMemo } from "react";

type Strength = "empty" | "weak" | "medium" | "strong";

function computeStrength(password: string): Strength {
  if (!password) return "empty";
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const len = password.length;

  // strong: length >= 12 with letters + numbers + symbols,
  // or length >= 10 with all three char classes
  if (len >= 10 && hasLetter && hasNumber && hasSymbol) return "strong";
  // medium: length >= 8 with a mix of letters + numbers
  if (len >= 8 && hasLetter && hasNumber) return "medium";
  // weak: length < 8 OR only letters (or otherwise insufficient)
  return "weak";
}

const FILL: Record<Strength, { width: string; color: string; label: string }> = {
  empty: { width: "", color: "", label: "密码强度：—" },
  weak: { width: "w-1/3", color: "bg-error", label: "密码强度：较弱" },
  medium: { width: "w-2/3", color: "bg-warning", label: "密码强度：中等" },
  strong: { width: "w-full", color: "bg-success", label: "密码强度：强" },
};

export interface PasswordStrengthBarProps {
  password: string;
}

export default function PasswordStrengthBar({
  password,
}: PasswordStrengthBarProps) {
  const strength = useMemo(() => computeStrength(password), [password]);
  const fill = FILL[strength];

  return (
    <div className="space-y-1">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {strength !== "empty" && (
          <div
            className={`rounded-full transition-all ${fill.width} ${fill.color}`}
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">{fill.label}</p>
    </div>
  );
}
