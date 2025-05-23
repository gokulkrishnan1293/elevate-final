"use client";

import { Security } from "@okta/okta-react";
import { OktaAuth, OktaAuthOptions } from "@okta/okta-auth-js";
import { useRouter } from "next/navigation";
import { AuthProviderProps } from "@/types/authProvider";
import { useMemo } from "react";
import RequireAuth from "../RequireAuth";
import { AppProvider } from "@/context/AppContext"; // Import AppProvider

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();

  const oktaAuth = useMemo(() => {
    const oktaConfig: OktaAuthOptions = {
      issuer: process.env.NEXT_PUBLIC_OKTA_ISSUER || "",
      clientId: process.env.NEXT_PUBLIC_OKTA_CLIENT_ID || "",
      redirectUri: process.env.NEXT_PUBLIC_OKTA_REDIRECT_URI || "",
      scopes: ["openid", "profile", "email"],
      pkce: true,
    };
    if (!oktaConfig.issuer || !oktaConfig.clientId || !oktaConfig.redirectUri) {
      console.error(
        "Okta configuration is missing. Please check your environment variables."
      );
      // Provide dummy values to avoid crashing OktaAuth constructor during potential SSR/build phases
      return new OktaAuth({
        issuer: "https://dummy.okta.com",
        clientId: "dummy",
        redirectUri: "http://dummy/callback",
      });
    }
    return new OktaAuth(oktaConfig);
  }, []);

  const restoreOriginalUri = async (
    _oktaAuth: OktaAuth,
    originalUri: string | undefined
  ) => {
    try {
      if (!originalUri || originalUri === "/") {
        console.log("No original URI found, redirecting to home page.");
        router.replace("/");
      } else {
        console.log("Restoring original URI:", originalUri);
        router.replace(originalUri);
      }
    } catch (error) {
      console.error("Error restoring original URI:", error);
      router.replace("/error");
    }
  };

  return (
  
    <Security
      oktaAuth={oktaAuth}
      restoreOriginalUri={restoreOriginalUri}
      onAuthRequired={() => {
        router.push("/login");
      }}
    >
      <AppProvider> {/* Wrap RequireAuth and its children with AppProvider */}
        <RequireAuth>{children}</RequireAuth>
      </AppProvider>
    </Security>
  
  );
};

export default AuthProvider;
