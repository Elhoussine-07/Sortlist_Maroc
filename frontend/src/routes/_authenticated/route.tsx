import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

const ENFORCE_AUTH = true;

function AuthenticatedLayout() {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  const reset = useAuthStore((state) => state.reset);
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(ENFORCE_AUTH);

  useEffect(() => {
    if (!ENFORCE_AUTH) return;

    if (!token) {
      navigate({ to: "/connexion", replace: true });
      return;
    }

    let cancelled = false;
    setIsChecking(true);

    getCurrentUser()
      .then((user) => {
        if (cancelled) return;
        setUser(user);
        setIsChecking(false);
      })
      .catch(() => {
        if (cancelled) return;
        reset();
        navigate({ to: "/connexion", replace: true });
      });

    return () => {
      cancelled = true;
    };
  }, [token, navigate, setUser, reset]);

  if (ENFORCE_AUTH && (!token || isChecking)) {
    return null;
  }

  return <Outlet />;
}
