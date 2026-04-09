import React from 'react';
import { Lightbulb } from 'lucide-react';

export function TeacherSuggestions() {
  const suggestions = [
    {
      id: 1,
      title: 'Ứng dụng AI trong phát hiện gian lận học thuật',
      field: 'AI',
      description: 'Xây dựng hệ thống sử dụng machine learning để phát hiện đạo văn và gian lận',
      difficulty: 'Khó',
    },
    {
      id: 2,
      title: 'Hệ thống quản lý thư viện thông minh',
      field: 'Web Development',
      description: 'Web application với tính năng tìm kiếm, mượn trả sách tự động',
      difficulty: 'Trung bình',
    },
    {
      id: 3,
      title: 'Ứng dụng mobile quản lý tài chính cá nhân',
      field: 'Mobile Development',
      description: 'App theo dõi thu chi, lập kế hoạch tài chính với React Native',
      difficulty: 'Trung bình',
    },
  ];

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gợi ý đề tài</h1>
        <p className="text-gray-600">Các đề tài gợi ý cho sinh viên</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{suggestion.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {suggestion.field}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      suggestion.difficulty === 'Khó'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {suggestion.difficulty}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{suggestion.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
