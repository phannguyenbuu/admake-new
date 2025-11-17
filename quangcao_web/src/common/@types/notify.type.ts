export interface NotifyProps {
  lead_id?: number;
  id?: string; // binary string (base64 hoặc URL)
  text?: string;
  description?: string;
  target?: string;
  type?: string;
  isDelete?: boolean;
}