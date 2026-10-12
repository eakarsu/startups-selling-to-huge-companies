import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-security-questionnaires","title":"AI Security Questionnaire Drafts","description":"Prepare a professional advisory report for ai security questionnaire drafts using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfSecurityQuestionnaires({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
