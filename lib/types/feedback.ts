export type FeedbackCategory =
  | "Food"
  | "Meal Timing"
  | "Service"
  | "Attendance"
  | "App"
  | "Menu"
  | "Environment"
  | "Suggestion"
  | "Other";

export type FeedbackType = "Suggestion" | "Complaint" | "Feedback";

export type FeedbackStatus = "Pending" | "Reviewed" | "Resolved";

export interface Feedback {
  id: string;
  userId: string;
  category: FeedbackCategory;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  response: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackWithUser extends Feedback {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateFeedbackDto {
  category: FeedbackCategory;
  type: FeedbackType;
  title: string;
  description: string;
}

export interface UpdateFeedbackDto {
  status?: FeedbackStatus;
  response?: string | null;
}
