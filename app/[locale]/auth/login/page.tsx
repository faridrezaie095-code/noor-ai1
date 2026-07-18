import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";
export const runtime = 'edge';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
