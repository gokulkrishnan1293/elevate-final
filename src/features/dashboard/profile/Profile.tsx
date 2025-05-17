"use client";

import React from "react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { useOktaAuth } from "@okta/okta-react";
import Link from "next/link";
import { ColourfulText } from "@/components/ui/colourful-text";
import { BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/utils/helpers";

const ProfileCard = () => {
  const { oktaAuth, authState } = useOktaAuth();
  return (
    <CardContainer className="w-full h-full">
      <CardBody
        className="bg-gray-50 relative group/card  
      dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full h-full rounded-xl p-6 border  
      "
      >
        <CardItem
          translateZ="50"
          className="text-xl font-bold text-neutral-600 dark:text-white w-full"
        >
          <div className="flex justify-between">
            <div>
              <span className="animated-gradient-text">
                {authState?.idToken?.claims?.name}
              </span>
            </div>
            <div>
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback>
                  {getInitials(authState?.idToken?.claims?.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </CardItem>
        <CardItem translateZ="100" className="w-full mt-4 items-center">
          <div className="flex justify-between">
            <div>
              <ColourfulText text="10" className="text-6xl" />
            </div>

            <div>
              <ColourfulText text="20" className="text-6xl" />
            </div>
          </div>
        </CardItem>
        <div className="flex justify-between items-center mt-20">
          <CardItem
            translateZ={20}
            className="px-4 py-2 rounded-xl text-xs font-normal dark:text-white"
          >
            <Link href="/events">View Awards → </Link>
          </CardItem>
          <CardItem
            translateZ={20}
            as="button"
            className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold cursor-pointer"
          >
            <Link href="/feedback">View Feedback → </Link>
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  );
};

export default ProfileCard;
