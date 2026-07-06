import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <div className="text-6xl mb-4">🍚</div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Không tìm thấy trang</h1>
        <p className="text-gray-500 mb-6">Trang bạn đang tìm không tồn tại.</p>
        <Link href="/" className="btn-primary">Về trang chủ</Link>
      </div>
    </div>
  );
}
