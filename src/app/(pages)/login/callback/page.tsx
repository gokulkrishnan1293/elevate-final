"use client";

import React from "react";
import { LoginCallback } from "@okta/okta-react";
import { useRouter } from "next/navigation";

const CallbackPage = () => {
  const router = useRouter();

  const onError = (error: Error) => {
    console.error("Okta Login Callback Error:", error);
    router.push("/error");
  };

  return (
    <div>
      <LoginCallback
        errorComponent={({ error }) => {
          onError(error);
          return <div>Error during login callback. Please try again.</div>;
        }}
      />
    </div>
  );
};

export default CallbackPage;
