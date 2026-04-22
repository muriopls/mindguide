import { ChatWindow } from '@/components/chat/ChatWindow';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto overflow-hidden">
      <ChatWindow />
    </div>
  );
}
