export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  image?: string;
}

export interface LogEntry {
  id: string;
  title: string;
  date: string;
  messages: Message[];
  history: ChatTurn[];
}

export type FontSize = 'normal' | 'large' | 'xlarge';
