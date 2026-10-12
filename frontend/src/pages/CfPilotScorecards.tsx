import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-pilot-scorecards","title":"Pilot Success Scorecards","description":"Prepare a professional advisory report for pilot success scorecards using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfPilotScorecards({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
