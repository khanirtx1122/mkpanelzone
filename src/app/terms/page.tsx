import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Terms of Service",
  description:
    "The licence terms, refund policy and service modification terms that govern the use of MK Panel Zone products.",
};

/**
 * Terms copy is carried over verbatim from the previous version — only the
 * presentation changed. See the note in the privacy page regarding the
 * previously dynamic "last updated" date.
 */
const LAST_UPDATED = "23 September 2026";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      breadcrumbLabel="Terms of Service"
      lastUpdated={LAST_UPDATED}
      accent="crimson"
      intro="By accessing or using MK Panel Zone products, you agree to be bound by these Terms of Service."
      sections={[
        {
          heading: "License & Usage",
          body: "Your purchase grants you a single-user license, issued for one device. Sharing, reverse engineering, distributing, or attempting to bypass our security measures will result in an immediate, permanent ban without refund. Changing hardware is permitted — contact support to have the access transferred.",
        },
        {
          heading: "Refunds Policy",
          body: "Due to the digital nature of our products and immediate access upon verification, all sales are final. We do not offer refunds once a product has been delivered.",
        },
        {
          heading: "Modifications",
          body: "We reserve the right to modify or discontinue, temporarily or permanently, our services with or without notice. We are not liable to you or any third party for any modification or discontinuance of the service.",
        },
      ]}
    />
  );
}
