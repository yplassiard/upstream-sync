export interface MessageRow {
  id: number;
  sender_id: number | null;
  thread_id: number;
  body: string;
  date: number;
}
