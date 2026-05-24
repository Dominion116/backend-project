import { Request } from 'express';

export type UserRole = 'pregnant_woman' | 'nurse' | 'admin' | 'researcher';
export type PregnancyStage = 'first_trimester' | 'second_trimester' | 'third_trimester' | 'postpartum';
export type Language = 'en' | 'yo' | 'ha' | 'ig';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  role: UserRole;
  pregnancy_stage: PregnancyStage | null;
  language: Language;
  due_date: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  profile?: UserProfile;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionSummary extends Conversation {
  message_count: number;
}

export interface ModelPredictRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  system_prompt: string;
}

export interface ModelPredictResponse {
  response: string;
}
