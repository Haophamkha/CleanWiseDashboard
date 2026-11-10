export type DisciplineAction = "CONFIRM" | "WAIVE" | "SUSPEND" | "PROPOSE_BAN" | "APPROVE_BAN" | "REJECT_BAN";

export interface DisciplineCase {
  id: number;
  worker: number;
  worker_name: string;
  booking: number;
  booking_code: string;
  sequence: number;
  kind_label: string;
  status: "PENDING" | "CONFIRMED" | "WAIVED";
  status_label: string;
  deduction: number;
  reason: string;
  review_note: string;
  occurred_at: string;
  expires_at: string;
  sanction: "" | "SUSPENDED" | "PROPOSED" | "BANNED";
  sanction_label: string;
  sanction_note: string;
  sanction_until: string | null;
  appeal_id: number | null;
  appeal_status: string | null;
}

export interface DisciplineDetail extends DisciplineCase {
  summary: {
    score: number;
    max_score: number;
    restricted_until: string | null;
    enforced: boolean;
    can_claim: boolean;
  };
  can_decide_proposal: boolean;
  can_apply_sanction: boolean;
}

export interface DisciplinePage {
  results: DisciplineCase[];
  next: string | null;
  previous: string | null;
}
