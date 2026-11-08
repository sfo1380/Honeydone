import Link from "next/link";
import { Logo } from "@/components/card";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-10">
      <Link href="/" aria-label="Honeydone home">
        <Logo />
      </Link>
      {children}
    </main>
  );
}
