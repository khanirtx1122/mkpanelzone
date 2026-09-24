import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How MK Panel Zone collects, uses and protects your information, including device binding and data retention.",
};

/**
 * The policy copy below is carried over verbatim from the previous version —
 * only its presentation changed. The "last updated" value is now a fixed date
 * rather than `new Date()`, which previously displayed the current day on every
 * visit and therefore never reflected when the policy actually changed.
 */
const LAST_UPDATED = "23 September 2026";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      breadcrumbLabel="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      accent="blue"
      intro="At MK Panel Zone, we take your privacy and operational security extremely seriously. This Privacy Policy describes how your personal information is collected, used, and protected."
      sections={[
        {
          heading: "Information We Collect",
          body: "We collect minimal information required for service delivery. This includes your Discord ID (if provided), email address for communication, and cryptographically hashed device identifiers to bind your access securely.",
        },
        {
          heading: "Device Binding & Security",
          body: "To protect our software and ensure exclusivity, we use device fingerprinting. This data is irreversibly hashed and cannot be used to identify your specific hardware configuration outside of our authentication flow.",
        },
        {
          heading: "Data Retention",
          body: "We retain your order details and device hashes only as long as you maintain an active license with us. We do not share, sell, or distribute your data to any third parties.",
        },
      ]}
    />
  );
}
