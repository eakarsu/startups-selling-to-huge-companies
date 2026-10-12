import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-revenue-forecast","title":"Revenue Forecast Roll-Up","description":"Prepare a professional advisory report for revenue forecast roll-up using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapRevenueForecast({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
