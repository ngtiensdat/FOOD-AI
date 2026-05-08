'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, User, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('CUSTOMER');
  const [legalDocuments, setLegalDocuments] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [successMessage, setSuccessMessage] = useState('');

  const validate = () => {
    const newErrors: any = {};
    if (name.trim().length < 2) newErrors.name = 'Tên phải có ít nhất 2 ký tự';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) newErrors.email = 'Email không đúng định dạng';

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) newErrors.password = 'Mật khẩu phải từ 8 ký tự, gồm cả chữ và số';

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu nhập lại không trùng khớp';
    }

    if (role === 'RESTAURANT' && legalDocuments.trim().length < 10) {
      newErrors.legalDocuments = 'Vui lòng cung cấp thông tin giấy tờ pháp lý rõ ràng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, legalDocuments }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Đăng ký thất bại');

      if (data.status === 'PENDING') {
        setSuccessMessage(data.message || 'Đăng ký thành công! Tài khoản của bạn đang chờ Admin phê duyệt.');
      } else {
        setSuccessMessage(data.message || 'Đăng ký thành công! Vui lòng xác minh tài khoản của bạn để đảm bảo an toàn.');
      }
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
        className="max-w-lg w-full"
      >
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-12 h-12 bg-white-400 rounded-xl flex items-center justify-center text-black shadow-lg">
              <img src="/favicon.ico" alt="Food AI Logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-3xl font-bold gradient-text">Food AI</span>
          </Link>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-100">
          {successMessage ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-6 select-none"
            >
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Xác minh tài khoản</h2>
                <p className="text-sm text-gray-500 font-medium px-2 leading-relaxed">
                  {successMessage}
                </p>
              </div>
              <div className="pt-4 border-t border-gray-50">
                <Link
                  href="/login"
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg hover:shadow-orange-200"
                >
                  Đi tới Đăng nhập <ArrowRight size={18} />
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Tạo tài khoản</h1>
                <p className="text-gray-500">Bắt đầu hành trình khám phá ẩm thực thông minh</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-5" suppressHydrationWarning>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Bạn là ai?</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole('CUSTOMER')}
                      className={`py-3 rounded-xl border-2 font-bold transition-all ${role === 'CUSTOMER' ? 'border-primary bg-orange-50 text-primary' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                      suppressHydrationWarning
                    >
                      Khách hàng
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('RESTAURANT')}
                      className={`py-3 rounded-xl border-2 font-bold transition-all ${role === 'RESTAURANT' ? 'border-primary bg-orange-50 text-primary' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                      suppressHydrationWarning
                    >
                      Nhà hàng
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Họ và tên</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn User"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      suppressHydrationWarning
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors.name}</p>}
                </div>

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
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Xác nhận mật khẩu</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 transition-all"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      suppressHydrationWarning
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                      suppressHydrationWarning
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors.confirmPassword}</p>}
                </div>

                {role === 'RESTAURANT' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-semibold text-gray-700 ml-1">Giấy tờ pháp lý / Thông tin xác thực</label>
                    <textarea
                      required
                      placeholder="Vui lòng cung cấp số giấy phép kinh doanh hoặc link ảnh giấy tờ pháp lý của bạn..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 outline-none focus:border-primary focus:ring-4 focus:ring-orange-50 transition-all min-h-[100px]"
                      value={legalDocuments}
                      onChange={(e) => setLegalDocuments(e.target.value)}
                      suppressHydrationWarning
                    />
                    {errors.legalDocuments && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors.legalDocuments}</p>}
                  </motion.div>
                )}

                <div className="flex items-start gap-3 p-1">
                  <input type="checkbox" required className="mt-1 accent-primary h-4 w-4" suppressHydrationWarning />
                  <label className="text-xs text-gray-500 leading-relaxed">
                    Tôi đồng ý với các <span className="text-primary font-bold">điều khoản bảo mật</span> và <span className="text-primary font-bold">chính sách sử dụng</span> của FoodAI.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full gradient-bg text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-orange-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  suppressHydrationWarning
                >
                  Đăng ký ngay <ArrowRight size={20} />
                </button>
              </form>

              <div className="mt-8 text-center text-gray-500">
                Đã có tài khoản? <Link href="/login" className="text-primary font-bold hover:underline">Đăng nhập</Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
