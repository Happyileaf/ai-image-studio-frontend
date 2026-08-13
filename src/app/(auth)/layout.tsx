import { TopNavbar } from "@/components/layout/TopNavbar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <TopNavbar />
      {children}
    </main>
  );
}
