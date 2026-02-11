
export interface User {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  followers: number;
  following: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
  replies: Comment[];
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  reactions?: Record<string, number>;
  comments: Comment[];
  shares: number;
  isNews?: boolean;
}

export interface GroupMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: Date;
  replyTo?: {
    userName: string;
    text: string;
  };
}

export interface Group {
  id: string;
  name: string;
  description: string;
  image: string;
  adminId: string;
  members: string[];
  pendingRequests: string[];
  isPrivate: boolean;
  messages?: GroupMessage[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
