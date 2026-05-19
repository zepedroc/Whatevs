export type CouncilMode = 'parallel' | 'conversation' | 'benchmark';

export interface RoundResponse {
  type: 'round_response';
  round: number;
  model: string;
  content: string | null;
  error: string | null;
}

export interface ModelResponse {
  model: string;
  content: string | null;
  error: string | null;
}

export interface CouncilResponse {
  query: string;
  responses: ModelResponse[];
}

export interface FinalEvent {
  type: 'final';
  data: CouncilResponse;
}

export type CouncilStreamEvent = RoundResponse | FinalEvent;

export type BenchmarkAnswerStatus = 'correct' | 'incorrect' | 'parsing_error';

export interface ModelBenchmarkResult {
  model: string;
  round1_raw_response?: string | null;
  final_raw_response?: string | null;
  round1_option: string | null;
  final_option: string | null;
  round1_correct: boolean;
  final_correct: boolean;
  round1_status?: BenchmarkAnswerStatus;
  final_status?: BenchmarkAnswerStatus;
  round1_parse_error: string | null;
  final_parse_error: string | null;
}

export interface BenchmarkCaseResult {
  case_index: number;
  question: string;
  expected_option: string;
  model_results: ModelBenchmarkResult[];
}

export interface BenchmarkSummary {
  total_cases: number;
  round1_correct: number;
  final_correct: number;
  round1_accuracy: number;
  final_accuracy: number;
  delta: number;
}

export interface BenchmarkCaseStartedEvent {
  type: 'benchmark_case_started';
  case_index: number;
  question: string;
}

export interface BenchmarkCaseResultEvent {
  type: 'benchmark_case_result';
  data: BenchmarkCaseResult;
}

export interface BenchmarkSummaryEvent {
  type: 'benchmark_summary';
  data: BenchmarkSummary;
}

export type BenchmarkStreamEvent =
  | BenchmarkCaseStartedEvent
  | BenchmarkCaseResultEvent
  | BenchmarkSummaryEvent;
