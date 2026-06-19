// Mục đích file này để làm gì: Modal dành riêng cho Admin để upload file Excel/CSV chứa danh sách đối tác và món ăn phục vụ import dữ liệu.
// Các file khác hay file này có ý nghĩa như nào: Được hiển thị trên giao diện quản trị AdminTable khi admin nhấn chọn nút "Nhập Excel".
// Các chức năng đặc biệt: Hỗ trợ kéo thả file, validate loại file xlsx/xls/csv, hiển thị tiến trình tải lên và link tải file biểu mẫu mẫu.
// Kiến thức, Design Pattern, nguyên tắc (SOLID, OOP...) đang được áp dụng trong file: SOLID (Single Responsibility), Presentational Modal Component, Drag and Drop File API.
// Các biến, hàm đặc biệt: AdminImportExcelModal component, handleDragOver(), handleDrop(), handleUpload().

import React, { useRef, useState } from 'react';
import { Upload, X, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import { adminService } from '@/services/admin.service';
import { useToastStore } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';

interface AdminImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminImportExcelModal({ isOpen, onClose, onSuccess }: AdminImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToastStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (LABELS.IMPORT_EXCEL.MESSAGES.VALID_TYPES.includes(selectedFile.type) || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        addToast(LABELS.IMPORT_EXCEL.MESSAGES.INVALID_FILE_TYPE, 'error');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await adminService.importMerchantsExcel(file);
      addToast(
        LABELS.IMPORT_EXCEL.MESSAGES.IMPORT_SUCCESS(res.createdMerchants ?? 0, res.appendedMerchants ?? 0),
        'success'
      );
      onSuccess();
      onClose();
      setFile(null);
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      const msg = errorResponse.response?.data?.message || LABELS.IMPORT_EXCEL.MESSAGES.IMPORT_ERROR_DEFAULT;
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([LABELS.IMPORT_EXCEL.MESSAGES.TEMPLATE_HEADERS + LABELS.IMPORT_EXCEL.MESSAGES.TEMPLATE_SAMPLE], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', LABELS.IMPORT_EXCEL.MESSAGES.TEMPLATE_FILENAME);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-wrapper">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="modal-overlay"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="modal-card max-w-lg w-full !p-0 shadow-2xl relative z-10 overflow-hidden"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
              {LABELS.IMPORT_EXCEL.UI.TITLE}
            </h3>
            <Button onClick={onClose} variant="none" size="none" className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6">
            <div className="mb-6 flex justify-between items-center bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">{LABELS.IMPORT_EXCEL.UI.TEMPLATE_TITLE}</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">{LABELS.IMPORT_EXCEL.UI.TEMPLATE_DESC}</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50">
                <Download className="w-4 h-4" />
                {LABELS.IMPORT_EXCEL.UI.BTN_DOWNLOAD}
              </Button>
            </div>

            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer
                ${file ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-slate-800 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-slate-900/30'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Input
                variant="none"
                type="file"
                ref={fileInputRef as unknown as React.Ref<HTMLInputElement | HTMLTextAreaElement>}
                className="hidden"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
              />

              {file ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <FileSpreadsheet className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-slate-200">{file.name}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                  <Button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    variant="none"
                    size="none"
                    className="mt-4 text-sm text-red-500 hover:text-red-700 font-medium"
                  >
                    {LABELS.IMPORT_EXCEL.UI.BTN_REMOVE_FILE}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-semibold text-gray-700 dark:text-slate-300">{LABELS.IMPORT_EXCEL.UI.DROPZONE_TITLE_FILE}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">{LABELS.IMPORT_EXCEL.UI.DROPZONE_SUBTITLE_FILE}</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>{LABELS.IMPORT_EXCEL.UI.BTN_CANCEL}</Button>
            <Button onClick={handleUpload} disabled={!file || loading} className="gap-2 min-w-[120px]">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {LABELS.IMPORT_EXCEL.UI.BTN_LOADING}</>
              ) : (
                <><Upload className="w-4 h-4" /> {LABELS.IMPORT_EXCEL.UI.BTN_IMPORT}</>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
