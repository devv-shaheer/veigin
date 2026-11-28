"use client";

/* ============================================================
   Login form — Client Component
   - Dark theme: bg-page #222220, text #d9d6cf, accent crimson #e0314b
   - Poppins for body text, font-heading for the title only
   - No new colors or fonts imported
   - Uses react-hook-form + zod on client and server (server action)
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

// Dummy component to keep the dark theme consistent
function HeroHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h1 className={`font-heading text-5xl tracking-[0.03em] text-bone mb-2 ${className ?? ""}`}>
      {children}
    </h1>
  );
}

function Subline({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-silver/60 text-sm mb-8">
      {children}
    </p>
  );
}

export default function LoginForm() {
  const {
    register,
    formState: { errors },
  } = useForm<LoginFormValues>({
    mode: "onBlur",
    resolver: zodResolver(loginSchema),
  });

  return (
    <html
      lang="en"
      className="font-pirata-one text-bone"
      suppressHydrationWarning
    >
      <body
        style={{
          backgroundColor: "#222220",
          color: "#d9d6cf",
          minHeight: "100vh",
        }}
      >
        <header className="border-b border-silver/15 bg-panel pb-6">
          <HeroHeading className="text-accent">Admin Panel</HeroHeading>
          <Subline>Sign in to manage the store</Subline>
        </header>

        <main className="max-w-md mx-auto p-8">
          <form
            action={loginAction}
            style={{
              maxWidth: "400px",
              margin: "0 auto",
            }}
          >
            <div className="mb-4">
              <label className="block text-silver/60 text-sm mb-2" style={{ display: "block" }}>
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                name="email"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "#171715",
                  color: "#d9d6cf",
                  border: "1px solid #a9adb1",
                  borderRadius: "4px",
                  fontFamily: "inherit",
                  fontSize: "1rem",
                }}
                required
                aria-describedby="email-help"
              />
              {errors.email && (
                <p id="email-help" className="text-crimson-bright text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-silver/60 text-sm mb-2" style={{ display: "block" }}>
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                name="password"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "#171715",
                  color: "#d9d6cf",
                  border: "1px solid #a9adb1",
                  borderRadius: "4px",
                  fontFamily: "inherit",
                  fontSize: "1rem",
                }}
                required
                aria-describedby="password-help"
              />
              {errors.password && (
                <p id="password-help" className="text-crimson-bright text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px 24px",
                backgroundColor: "#b3122b",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontFamily: "inherit",
                fontSize: "1rem",
                fontWeight: "700",
                cursor: "pointer",
                marginTop: "12px",
              }}
            >
              Sign in
            </button>
          </form>
        </main>
      </body>
    </html>
  );
}
