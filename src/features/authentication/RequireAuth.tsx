"use client";

import { useEffect, useMemo, useState } from "react";
import { useOktaAuth } from "@okta/okta-react";
import { AuthProviderProps } from "@/types/authProvider";
import { usePathname } from "next/navigation";
import { upsertEmployee, type EmployeeInput } from "@/actions/authentication";

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
    const handleAuth = async () => {
      if (authState?.isAuthenticated) {
        try {
          const user = await oktaAuth.getUser();
          if (user) {
            const employeeData: EmployeeInput = {
              lanId: String(user?.lanID || user?.email),
              firstName: String(user?.firstName || user?.email),
              lastName: String(user?.lastName || user?.email),
              email: String(user?.email || "DUMMY@CIGNA.COM"),
              profilePhoto: undefined,
              cignaManagerId: undefined,
              isContractor: undefined,
              isUserActive: true,
            };

            const result = await upsertEmployee(employeeData);
          }
        } catch (error) {
          console.error("Error during user upsert process:", error);
        }
      } else {
        if (pathname !== callbackPath) {
          const originalUri = pathname;
          oktaAuth.signInWithRedirect({ originalUri });
        }
      }
    };

    handleAuth();
  }, [authState, oktaAuth, pathname, callbackPath]);

  return <div> {children}</div>;
};

export default RequireAuth;
