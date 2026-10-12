import AIReport from './AIReport';

interface AIResponseProps {
  result: unknown;
  loading: boolean;
}

export default function AIResponse({ result, loading }: AIResponseProps) {
  return <AIReport response={result} loading={loading} title="AI response" />;
}
