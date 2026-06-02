import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/shared/infrastructure/shadcn/components/ui/sidebar";
import { EMAIL_VERIFICATION_ROUTE, SIGN_IN_ROUTE } from "@/shared/infrastructure/utils/routes";

import { auth } from "@/shared/infrastructure/libs/auth";
import { AppSidebar } from "@/shared/infrastructure/shadcn/components/app-sidebar";
import { Separator } from "@/shared/infrastructure/shadcn/components/ui/separator";
import { UserLoged } from "@/shared/infrastructure/types/userLoged";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await auth();

  if (!session) {
    redirect(SIGN_IN_ROUTE);
  }

  if (!session.user.emailVerified) {
    redirect(EMAIL_VERIFICATION_ROUTE);
  }

  const user: UserLoged = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    image: session.user.image,
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
