import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-email-sync","title":"Email Sync (IMAP/Gmail)","description":"Prepare a professional advisory report for email sync (imap/gmail) using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapEmailSync({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
