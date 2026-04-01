export default function MessagesPage() {
  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Tin nhắn
        </h1>
      </header>
      <div className="py-16 text-center text-gray-400">
        Chưa có cuộc trò chuyện nào.
      </div>
    </div>
  );
}
