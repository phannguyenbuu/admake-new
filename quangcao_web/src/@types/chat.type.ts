export interface GroupProps {
  id: number,
  members: number,
  user_id: string;
  name:string,
  message_id: string;
  description: string;
  img:string,
  time:string,
  msg:string,
  unread:number,
  status?:string,
  pinned:boolean,
  address:string
}

export interface MsgListTypeProps {
  menu?: any;
  messages: MessageTypeProps[];
  onDelete?: any;
}

export interface MsgTypeProps {
  menu?: any;
  el?: MessageTypeProps;
  onDelete?: any;
}

interface ReactProps {
  rate: number;
}

export interface MessageTypeProps {
  id: number;
  group_id: number;
  workspace_id: string;

  file_url:string;
  incoming: boolean;
  text: string;
  message_id:string;
  type:string;
  user_id: string;
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  preview: string;
  reply: string;
  role:number;
  icon:string;
  status:string;
  is_favourite:boolean;
  
  username:string;
  link:string;
  
  react: ReactProps;
}

export function generateUniqueIntId(): number {
  // timestamp hiện tại (ms) nhân 1000 + random int 0-999
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}
