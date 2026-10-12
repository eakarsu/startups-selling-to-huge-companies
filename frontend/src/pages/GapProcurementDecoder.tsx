import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-procurement-decoder","title":"Procurement Process Decoder","description":"Prepare a professional advisory report for procurement process decoder using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapProcurementDecoder({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
