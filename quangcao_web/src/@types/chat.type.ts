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
  pinned:boolean
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

export interface MessageTypeProps {
  id: number;
  group_id: number;

  file_url:string;
  incoming: boolean;
  text: string;
  message_id:string;
  type:string;
  user_id: string;
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;

  preview: string;
  reply: string;
  user_role:string;
  icon:string;
  status:string;
  
  username:string;
  link:string;
  // các trường khác...
}

export function generateUniqueIntId(): number {
  // timestamp hiện tại (ms) nhân 1000 + random int 0-999
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}
