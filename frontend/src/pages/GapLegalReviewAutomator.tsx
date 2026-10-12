import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-legal-review-automator","title":"Legal Review Automator","description":"Prepare a professional advisory report for legal review automator using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapLegalReviewAutomator({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
