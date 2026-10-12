import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-org-chart","title":"Org-Chart Relationships","description":"Prepare a professional advisory report for org-chart relationships using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapOrgChart({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
