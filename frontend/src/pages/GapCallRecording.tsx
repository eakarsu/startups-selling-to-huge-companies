import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-call-recording","title":"Call Recording Ingest","description":"Prepare a professional advisory report for call recording ingest using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapCallRecording({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
