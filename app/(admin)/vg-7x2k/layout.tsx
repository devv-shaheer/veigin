export const metadata = {
  title: "Admin Login",
  description: "Admin login panel",
  robots: {
    index: false,
    follow: false,
  },
} as const;

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell admin-shell__login">
      <div className="admin-shell__login-card">
        <div className="admin-shell__login-brand">
          <svg
            className="admin-shell__login-logo"
            viewBox="0 0 120 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <text
              x="0"
              y="24"
              fontFamily="Georgia, serif"
              fontSize="24"
              fontWeight="400"
              letterSpacing="0.02em"
              fill="currentColor"
              style={{ opacity: 0.6 }}
            >
              VEIGIN
            </text>
          </svg>
          <h1 className="admin-shell__login-title">Admin Access</h1>
          <p className="admin-shell__login-subtitle">Sign in to manage the store</p>
        </div>
        <div className="admin-shell__login-form">{children}</div>
      </div>
    </div>
  );
}