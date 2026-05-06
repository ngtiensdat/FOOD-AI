'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Sparkles, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) newErrors.email = 'Email không đúng định dạng';
    if (password.length < 1) newErrors.password = 'Vui lòng nhập mật khẩu';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Đăng nhập thất bại');

      // Lưu thông tin vào localStorage
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      alert('Đăng nhập thành công!');
      window.location.href = '/';
    } catch (error: any) {
      alert('Lỗi: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-primary font-bold transition-all">
        <ArrowLeft size={20} /> Quay lại
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-12 h-12 bg-white-400 rounded-xl flex items-center justify-center text-black shadow-lg">
              <img src="/favicon.ico" alt="Food AI Logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-3xl font-bold gradient-text">Food AI</span>
          </Link>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">Đăng nhập</h1>
            <p className="text-gray-500">Chào mừng bạn quay trở lại với FoodAI</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6" suppressHydrationWarning>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="email"
                  required
                  placeholder="user123@gmail.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  suppressHydrationWarning
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Mật khẩu</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                  suppressHydrationWarning
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors.password}</p>}
            </div>

            <div className="text-right">
              <a href="#" className="text-sm font-bold text-primary hover:underline">Quên mật khẩu?</a>
            </div>

            <button
              type="submit"
              className="w-full gradient-bg text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-orange-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              suppressHydrationWarning
            >
              Đăng nhập <ArrowRight size={20} />
            </button>
          </form>

          <div className="mt-8 text-center text-gray-500">
            Chưa có tài khoản? <Link href="/register" className="text-primary font-bold hover:underline">Đăng ký ngay</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
