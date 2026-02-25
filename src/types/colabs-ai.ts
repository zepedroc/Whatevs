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
