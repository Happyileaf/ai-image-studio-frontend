import { TopNavbar } from "@/components/layout/TopNavbar";
import { ForbiddenToast } from "@/components/layout/forbidden-toast";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNavbar />
      <main className="min-h-[calc(100vh-4rem)]">
        <ForbiddenToast />
        {children}
      </main>
    </>
  );
}
