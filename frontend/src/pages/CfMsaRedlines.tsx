import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-msa-redlines","title":"AI MSA Redline Drafts","description":"Prepare a professional advisory report for ai msa redline drafts using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfMsaRedlines({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
