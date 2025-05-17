"use client";

import { useEffect, useMemo } from "react";
import { useOktaAuth } from "@okta/okta-react";
import { AuthProviderProps } from "@/types/authProvider";
import { usePathname } from "next/navigation";

const RequireAuth: React.FC<AuthProviderProps> = ({ children }) => {
  const { oktaAuth, authState } = useOktaAuth();
  const pathname = usePathname();

  const callbackPath = useMemo(() => {
    try {
      const redirectUri = process.env.NEXT_PUBLIC_OKTA_REDIRECT_URI || "";
      return new URL(redirectUri).pathname;
    } catch (error) {
      console.error("Invalid NEXT_PUBLIC_OKTA_REDIRECT_URI:", error);
      return "/login/callback";
    }
  }, []);

  useEffect(() => {
    if (!authState?.isAuthenticated) {
      if (pathname !== callbackPath) {
        const originalUri = pathname;
        oktaAuth.signInWithRedirect({ originalUri });
      }
    }
  }, [authState, pathname, callbackPath, oktaAuth]);

  return <div> {children}</div>;
};

export default RequireAuth;
