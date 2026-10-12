import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-f100-playbook","title":"F100 Procurement Playbook Library","description":"Prepare a professional advisory report for f100 procurement playbook library using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfF100Playbook({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
