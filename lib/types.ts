export interface Endpoint {
  id: string;
  readonly_id: string;
  created_at: string;
  expires_at: string;
}

export interface WebhookEvent {
  id: string;
  endpoint_id: string;
  created_at: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  parsed_body: Record<string, unknown> | null;
  source_ip: string | null;
  query_params: Record<string, string> | null;
}

export interface VerificationResult {
  valid: boolean;
  scheme: string;
  computedSignature: string;
  receivedSignature: string;
  details: string;
  error?: string;
}
