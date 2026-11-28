"use client";

/* ============================================================
   Login form — Client Component (Admin Shell Design System)
   ============================================================ */

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginAction } from "./login-action";

// Zod schema for the login form
const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Type inferred from schema
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const {
    register,
    formState: { errors },
  } = useForm<LoginFormValues>({
    mode: "onBlur",
    resolver: zodResolver(loginSchema),
  });

  return (
    <form action={loginAction} className="admin-shell__login-form">
      <div className="space-y-5">
        <div className="admin-shell__form-group">
          <label htmlFor="email" className="admin-shell__label">
            Email
          </label>
          <input
            {...register("email")}
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            className="admin-shell__input"
            required
            aria-describedby="email-help"
            placeholder="admin@veigin.pk"
          />
          {errors.email && (
            <p id="email-help" className="text-sm mt-2" style={{ color: "var(--admin-crimson)" }}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="admin-shell__form-group">
          <label htmlFor="password" className="admin-shell__label">
            Password
          </label>
          <input
            {...register("password")}
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            className="admin-shell__input"
            required
            aria-describedby="password-help"
            placeholder="••••••••"
          />
          {errors.password && (
            <p id="password-help" className="text-sm mt-2" style={{ color: "var(--admin-crimson)" }}>
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="admin-shell__btn admin-shell__btn--primary w-full py-3 mt-2"
        >
          Sign in
        </button>
      </div>
    </form>
  );
}