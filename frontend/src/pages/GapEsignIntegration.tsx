import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-esign-integration","title":"E-Sign Integration","description":"Prepare a professional advisory report for e-sign integration using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapEsignIntegration({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
