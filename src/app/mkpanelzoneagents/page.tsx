import MkAgentsLogin from "../mk-agents/page";

export const metadata = {
  title: "Reseller Login | MK Panel Zone",
  description: "MK Panel Zone reseller / agent access panel.",
};

/**
 * RESELLER LOGIN.
 *
 * The owner-facing route is /mkpanelzoneagents. It renders the same dedicated
 * agent login as /mk-agents (one implementation, two entry points) and is
 * completely separate from the official owner admin at /mkpanelzoneadmin.
 */
export default function ResellerLoginPage() {
  return <MkAgentsLogin />;
}
