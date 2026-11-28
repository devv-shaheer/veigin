import { logoutAction } from "./logout-action";

function SignedIn({ adminEmail }: { adminEmail: string }) {
  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "2rem" }}>
      <h1 className="font-heading text-3xl text-bone mb-6">
        Admin Panel
      </h1>

      <p className="text-silver/60 mb-4">
        Signed in as <span className="text-crimson-bright">{adminEmail}</span>
      </p>

      <form action={logoutAction}>
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
          Log out
        </button>
      </form>
    </div>
  );
}

export const metadata = {
  title: "Admin Panel",
  description: "Admin panel for Veigin",
  robots: {
    index: false,
    follow: false,
  },
} as const;

export default async function AdminPage() {
  // The proxy has already verified the session before this component renders
  // We just need to show the admin UI. In a real app we'd get the email from the session.
  // For now, show placeholder
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <SignedIn adminEmail="admin@veigin.pk" />
    </div>
  );
}