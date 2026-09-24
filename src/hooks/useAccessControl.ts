import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AccessStatus = "pending" | "active" | "paused" | "suspended" | "cancelled" | null;

export type LicenseInfo = {
  license_type: string;
  license_status: string;
  trial_ends_at: string | null;
  access_ends_at: string | null;
  billing_provider: string | null;
  stripe_subscription_id: string | null;
} | null;

export function useAccessControl() {
  const { user } = useAuth();
  const [accessStatus, setAccessStatus] = useState<AccessStatus>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [license, setLicense] = useState<LicenseInfo>(null);
  const [licenseValid, setLicenseValid] = useState(true);
  const [loading, setLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    if (!user) {
      setAccessStatus(null);
      setIsSuperAdmin(false);
      setLicense(null);
      setLicenseValid(true);
      setLoading(false);
      return;
    }

    try {
      // Check role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const roles = (roleData || []).map((r: any) => r.role);
      const isSA = roles.includes("superadmin");
      setIsSuperAdmin(isSA);

      // Check access status
      const { data: accessData } = await supabase
        .from("account_access_control")
        .select("access_status")
        .eq("user_id", user.id)
        .single();

      if (accessData) {
        setAccessStatus(accessData.access_status as AccessStatus);
      } else {
        await supabase.from("account_access_control").insert({ user_id: user.id });
        setAccessStatus("pending");
      }

      // Check license
      const { data: licenseData } = await supabase
        .from("account_licenses")
        .select("license_type, license_status, trial_ends_at, access_ends_at, billing_provider, stripe_subscription_id")
        .eq("user_id", user.id)
        .single();

      if (licenseData) {
        setLicense(licenseData);
        // Validate license client-side
        const { license_type, license_status, trial_ends_at, access_ends_at } = licenseData;
        if (license_status !== "active") {
          setLicenseValid(false);
        } else if (["partnership", "lifetime", "subscription"].includes(license_type)) {
          setLicenseValid(true);
        } else if (license_type === "trial" && trial_ends_at) {
          setLicenseValid(new Date(trial_ends_at) > new Date());
        } else if (license_type === "manual" && access_ends_at) {
          setLicenseValid(new Date(access_ends_at) > new Date());
        } else {
          setLicenseValid(false);
        }
      } else {
        setLicense(null);
        setLicenseValid(false);
      }

      // Superadmin always has active access
      if (isSA) {
        setAccessStatus("active");
        setLicenseValid(true);
      }
    } catch (err) {
      console.error("Access control check failed:", err);
      setAccessStatus("pending");
      setLicenseValid(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return { accessStatus, isSuperAdmin, license, licenseValid, loading, refetch: checkAccess };
}
