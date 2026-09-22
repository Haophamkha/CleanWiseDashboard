export type ReviewUserSummary = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
};

export type ReviewSchedule = {
  id: number;
  sequence_no: number;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: string;
};

export type ReviewImage = {
  id: number;
  image: string;
  caption: string | null;
  created_at: string;
};

export type Review = {
  id: number;
  assignment_id: number;
  booking_id: number;
  booking_code: string;
  schedule: ReviewSchedule;
  customer: ReviewUserSummary;
  worker: ReviewUserSummary;
  rating: number;
  comment: string | null;
  admin_reply: string | null;
  replied_at: string | null;
  is_visible: boolean;
  images: ReviewImage[];
  created_at: string;
  updated_at: string;
};

export type ReviewListParams = {
  worker_id: number;
  rating?: number;
  is_visible?: boolean;
};

