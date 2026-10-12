import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-budget-cycle-predictor","title":"Budget Cycle Predictor","description":"Prepare a professional advisory report for budget cycle predictor using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapBudgetCyclePredictor({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
