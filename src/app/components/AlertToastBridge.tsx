import { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

type ToastItem = {
  id: number;
  message: string;
};

export function AlertToastBridge() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nativeAlertRef = useRef<typeof window.alert | null>(null);

  useEffect(() => {
    nativeAlertRef.current = window.alert.bind(window);

    window.alert = ((message?: unknown) => {
      const text = String(message ?? '').trim();
      if (!text) return;

      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, message: text }]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 5000);
    }) as typeof window.alert;

    return () => {
      if (nativeAlertRef.current) {
        window.alert = nativeAlertRef.current;
      }
    };
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[1000] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-xl border border-blue-200 bg-white px-4 py-3 shadow-lg"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 text-blue-600" />
            <p className="text-sm font-medium text-gray-800">{toast.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

