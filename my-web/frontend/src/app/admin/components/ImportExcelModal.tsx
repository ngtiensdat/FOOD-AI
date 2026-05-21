import React, { useRef, useState } from 'react';
import { Upload, X, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/base/Button';
import { adminService } from '@/services/food.service';
import { useToastStore } from '@/store/useToastStore';
import { IMPORT_EXCEL_CONSTANTS } from '@/constants/import-excel.constant';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportExcelModal({ isOpen, onClose, onSuccess }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToastStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (IMPORT_EXCEL_CONSTANTS.VALID_TYPES.includes(selectedFile.type) || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        addToast(IMPORT_EXCEL_CONSTANTS.MESSAGES.INVALID_FILE_TYPE, 'error');
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
        IMPORT_EXCEL_CONSTANTS.MESSAGES.IMPORT_SUCCESS(res.data.createdMerchants, res.data.appendedMerchants),
        'success'
      );
      onSuccess();
      onClose();
      setFile(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || IMPORT_EXCEL_CONSTANTS.MESSAGES.IMPORT_ERROR_DEFAULT;
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([IMPORT_EXCEL_CONSTANTS.TEMPLATE_HEADERS + IMPORT_EXCEL_CONSTANTS.TEMPLATE_SAMPLE], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', IMPORT_EXCEL_CONSTANTS.TEMPLATE_FILENAME);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
              Import dữ liệu hàng loạt
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6 flex justify-between items-center bg-blue-50 p-4 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-blue-900">Tải file mẫu (Template)</p>
                <p className="text-xs text-blue-700 mt-1">Sử dụng file CSV/Excel mẫu để nhập liệu chuẩn xác.</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                <Download className="w-4 h-4" />
                Tải mẫu
              </Button>
            </div>

            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer
                ${file ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
              />
              
              {file ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <FileSpreadsheet className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-semibold text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="mt-4 text-sm text-red-500 hover:text-red-700 font-medium"
                  >
                    Xóa file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-semibold text-gray-700">Click hoặc kéo thả file vào đây</p>
                  <p className="text-sm text-gray-500 mt-2">Hỗ trợ định dạng .xlsx, .csv</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
            <Button onClick={handleUpload} disabled={!file || loading} className="gap-2 min-w-[120px]">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
              ) : (
                <><Upload className="w-4 h-4" /> Import Ngay</>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
