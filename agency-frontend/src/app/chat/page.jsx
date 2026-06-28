import { ChatInterface } from '@/components/ChatInterface';

export const metadata = {
  title: 'Chat - AI Agency',
  description: 'Chat with CEO (Hermes) or SBA (OpenCode) agents'
};

export default function ChatPage() {
  return (
    <main>
      <ChatInterface />
    </main>
  );
}
