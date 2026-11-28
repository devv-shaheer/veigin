/* ============================================================
   Login page — /vg-7x2k (Server Component for metadata)
   ============================================================ */

export const metadata = {
  title: "Admin Login",
  description: "Admin login panel",
  robots: {
    index: false,
    follow: false,
  },
} as const;

import LoginForm from "./LoginForm";

export default function LoginPage() {
  return <LoginForm />;
}