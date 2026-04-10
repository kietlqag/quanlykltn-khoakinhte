import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router';
import { Lock, User } from 'lucide-react';
import loginCoverImage from '../../assets/bialogin.jpg';
import hcmuteLogo from '../../assets/LogoHCMUTE-NoBG.png';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, isAuthReady } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Đăng nhập thất bại');
    }
    setIsSubmitting(false);
  };

  if (isAuthReady && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      className="h-screen overflow-hidden flex items-center justify-center p-4 bg-center bg-no-repeat bg-slate-100"
      style={{
        backgroundImage: `url(${loginCoverImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 42%',
      }}
    >
      <div className="w-full max-w-md max-h-full overflow-auto">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/60">
          <div className="text-center mb-6">
            <img src={hcmuteLogo} alt="Logo HCMUTE" className="w-20 h-20 object-contain mx-auto mb-3" />
            <h1 className="text-base font-bold text-blue-600">HỆ THỐNG QUẢN LÝ KHÓA LUẬN TỐT NGHIỆP</h1>
            <p className="text-sm text-gray-600 mt-1">Khoa Kinh tế</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Nhập email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-lg hover:shadow-xl disabled:bg-blue-300"
            >
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
