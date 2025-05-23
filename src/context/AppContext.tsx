"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { OrganizationOutput } from '@/lib/schemas/organization'; // Assuming you might want to store the whole object
import { getOrganizations } from '@/actions/organization'; // To fetch a default organization
import { useOktaAuth } from '@okta/okta-react'; // To potentially fetch user-specific orgs/permissions

// Define the shape of the context data
interface AppContextType {
  selectedOrganization: OrganizationOutput | null;
  setSelectedOrganization: (organization: OrganizationOutput | null) => void;
  userPermissions: string[]; // Example: ['read:art', 'write:team'] - adjust as needed
  setUserPermissions: (permissions: string[]) => void; // Placeholder
  isLoadingAppContext: boolean;
  availableOrganizations: OrganizationOutput[]; // List of orgs user has access to
  switchOrganization: (organizationKey: number) => Promise<void>; // Function to switch org
  refreshAppContext: () => Promise<void>; // Function to manually refresh context
}

// Create the context with a default undefined value
const AppContext = createContext<AppContextType | undefined>(undefined);

// Define the props for the provider
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [selectedOrganization, setSelectedOrganizationState] = useState<OrganizationOutput | null>(null);
  const [userPermissions, setUserPermissionsState] = useState<string[]>([]);
  const [isLoadingAppContext, setIsLoadingAppContext] = useState(true);
  const [availableOrganizations, setAvailableOrganizations] = useState<OrganizationOutput[]>([]);
  const { authState } = useOktaAuth();

  const setSelectedOrganization = (organization: OrganizationOutput | null) => {
    setSelectedOrganizationState(organization);
    // Optionally, save to localStorage or trigger permission refresh
    if (organization) {
      localStorage.setItem('selectedOrganizationKey', organization.organizationKey.toString());
      // fetchUserPermissionsForOrg(organization.organizationKey); // Example
    } else {
      localStorage.removeItem('selectedOrganizationKey');
    }
  };

  const setUserPermissions = (permissions: string[]) => {
    setUserPermissionsState(permissions);
  };
  
  // Function to fetch initial data or a default organization
  const initializeAppContext = useCallback(async () => {
    if (!authState?.isAuthenticated) {
      setIsLoadingAppContext(false);
      setSelectedOrganization(null);
      setAvailableOrganizations([]);
      // setUserPermissions([]); // Clear permissions if not authenticated
      return;
    }
    setIsLoadingAppContext(true);
    try {
      // 1. Fetch available organizations for the user
      //    For now, using getOrganizations() which fetches all.
      //    In a real multi-tenant app, this would be user-specific.
      const orgsResult = await getOrganizations(); // This fetches all orgs; adapt for user-specific orgs later
      if (orgsResult.success && orgsResult.data) {
        setAvailableOrganizations(orgsResult.data);

        // 2. Determine the selected organization
        const storedOrgKey = localStorage.getItem('selectedOrganizationKey');
        let currentOrg: OrganizationOutput | null = null;

        if (storedOrgKey) {
          currentOrg = orgsResult.data.find(org => org.organizationKey.toString() === storedOrgKey) || null;
        }
        if (!currentOrg && orgsResult.data.length > 0) {
          currentOrg = orgsResult.data[0]; // Default to the first organization if none stored or stored is invalid
        }
        setSelectedOrganization(currentOrg); // This will also update localStorage

        // 3. Fetch user permissions for the selected organization (placeholder)
        if (currentOrg) {
          // console.log(`Fetching permissions for org: ${currentOrg.organizationKey}`);
          // const permissions = await fetchPermissionsForUserAndOrg(authState.accessToken, currentOrg.organizationKey);
          // setUserPermissions(permissions);
          setUserPermissionsState(['read:all', 'write:all']); // Placeholder permissions
        } else {
          setUserPermissionsState([]);
        }

      } else {
        console.error("Failed to fetch organizations for app context:", orgsResult.message);
        setAvailableOrganizations([]);
        setSelectedOrganization(null);
      }
    } catch (error) {
      console.error("Error initializing app context:", error);
      setAvailableOrganizations([]);
      setSelectedOrganization(null);
    } finally {
      setIsLoadingAppContext(false);
    }
  }, [authState]);

  useEffect(() => {
    initializeAppContext();
  }, [initializeAppContext]);

  const switchOrganization = useCallback(async (organizationKey: number) => {
    const newOrg = availableOrganizations.find(org => org.organizationKey === organizationKey);
    if (newOrg) {
      setIsLoadingAppContext(true); // Indicate loading while switching
      setSelectedOrganization(newOrg);
      // Re-fetch permissions for the new organization (placeholder)
      // console.log(`Switched to org: ${newOrg.organizationName}. Fetching new permissions...`);
      // const permissions = await fetchPermissionsForUserAndOrg(authState.accessToken, newOrg.organizationKey);
      // setUserPermissions(permissions);
      setUserPermissionsState(['read:all', 'write:all']); // Placeholder
      setIsLoadingAppContext(false);
    } else {
      console.warn(`Attempted to switch to unknown organization key: ${organizationKey}`);
    }
  }, [availableOrganizations, authState]);

  const refreshAppContext = useCallback(async () => {
    await initializeAppContext();
  }, [initializeAppContext]);


  return (
    <AppContext.Provider value={{ 
        selectedOrganization, 
        setSelectedOrganization, 
        userPermissions, 
        setUserPermissions, 
        isLoadingAppContext,
        availableOrganizations,
        switchOrganization,
        refreshAppContext
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the AppContext
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
