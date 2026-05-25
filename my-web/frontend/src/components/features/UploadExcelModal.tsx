// Mục đích file này để làm gì: Component Modal hỗ trợ chủ nhà hàng tải lên danh sách món ăn hàng loạt từ file Excel.
// Các file khác hay file này có ý nghĩa như nào: Được gọi từ trang Quản lý thực đơn (Admin), giúp tối ưu thời gian nhập liệu thay vì tạo từng món.
// Các chức năng đặc biệt: Đọc và parse file Excel ngay dưới local, tự động map các cột tương ứng, chọn chi nhánh và danh mục trước khi upload, tải file mẫu.
// Các biến, hàm đặc biệt trong file: handleFileUpload (parse Excel), handleSubmit (gửi API), previewData (hiển thị trước data).
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XCircle, FileSpreadsheet, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/base/Button';
import * as XLSX from 'xlsx';
import { foodService } from '@/services/food.service';
import { toast } from '@/store/useToastStore';
import { usePublicCategories } from '@/hooks/usePublicCategories';
import { LABELS } from '@/constants/labels';
import { EXCEL_SAMPLE_DATA } from '@/constants/excel.constant';

interface CategoryFlat {
  id: number;
  name: string;
  groupName: string;
}

interface UploadExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  myBranches: { id: number; name: string;[key: string]: unknown }[];
  onSuccess: () => void;
}

export const UploadExcelModal = ({ isOpen, onClose, myBranches, onSuccess }: UploadExcelModalProps) => {
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [flatCategories, setFlatCategories] = useState<CategoryFlat[]>([]);
  const [previewData, setPreviewData] = useState<{ name: string; price: number; description: string; image: string; tags: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { categories: rawCategories, loading: loadingCategories } = usePublicCategories(selectedBranchId);

  // Tự động chọn chi nhánh nếu chỉ có 1
  useEffect(() => {
    if (myBranches && myBranches.length === 1 && !selectedBranchId) {
      setSelectedBranchId(myBranches[0].id);
    }
  }, [myBranches, selectedBranchId]);

  // Tải danh mục theo cơ sở được chọn
  useEffect(() => {
    if (!rawCategories.length) {
      setFlatCategories([]);
      setSelectedCategoryId('');
      return;
    }

    const flat: CategoryFlat[] = [];
    rawCategories.forEach(group => {
      // Tìm root category tự động tạo (cùng tên Group, parentId = null)
      const rootCat = group.categories?.find(c => c.parentId === null && c.name === group.name);
      if (rootCat) {
        // Thêm Group như 1 option chọn trực tiếp (dùng ID root category ẩn)
        flat.push({ id: rootCat.id, name: group.name, groupName: LABELS.RESTAURANT.UPLOAD_EXCEL.MAIN_GROUP });
      }
      // Thêm các sub-category (bỏ qua root category cùng tên group)
      group.categories?.forEach(cat => {
        if (!(cat.parentId === null && cat.name === group.name)) {
          flat.push({ id: cat.id, name: cat.name, groupName: group.name });
        }
      });
    });
    setFlatCategories(flat);
    setSelectedCategoryId('');
  }, [rawCategories]);

  if (!isOpen) return null;

  // Tải xuống file Excel mẫu
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(EXCEL_SAMPLE_DATA);
    ws['!cols'] = [
      { wch: 25 }, { wch: 12 }, { wch: 45 }, { wch: 35 }, { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, LABELS.RESTAURANT.UPLOAD_EXCEL.SHEET_NAME);
    XLSX.writeFile(wb, LABELS.RESTAURANT.UPLOAD_EXCEL.FILE_NAME);
    toast.success(LABELS.RESTAURANT.UPLOAD_EXCEL.DOWNLOAD_SUCCESS);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as Record<string, string | number | undefined>[];
        const { COLS } = LABELS.RESTAURANT.UPLOAD_EXCEL;

        const mappedData = data.map(row => ({
          name: String(row[COLS.NAME] || row['Name'] || ''),
          price: Number(row[COLS.PRICE] || row['Price'] || 0),
          description: String(row[COLS.DESC] || row['Description'] || ''),
          image: String(row[COLS.IMAGE] || row['Image'] || ''),
          tags: row[COLS.TAGS] ? String(row[COLS.TAGS]) : '',
        })).filter(f => f.name && f.price > 0);

        if (mappedData.length === 0) {
          return toast.error(LABELS.RESTAURANT.UPLOAD_EXCEL.INVALID_DATA);
        }
        setPreviewData(mappedData);
        toast.success(LABELS.RESTAURANT.UPLOAD_EXCEL.READ_SUCCESS(mappedData.length));
      } catch (error) {
        toast.error(LABELS.RESTAURANT.UPLOAD_EXCEL.READ_ERROR);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async () => {
    if (!selectedBranchId) {
      return toast.error(LABELS.RESTAURANT.UPLOAD_EXCEL.BRANCH_REQUIRED);
    }
    if (previewData.length === 0) {
      return toast.error(LABELS.RESTAURANT.UPLOAD_EXCEL.EMPTY_DATA);
    }

    setIsUploading(true);
    const payload = {
      restaurantId: selectedBranchId,
      foods: previewData.map(f => ({
        name: f.name,
        price: f.price,
        description: f.description,
        image: f.image,
        categoryId: selectedCategoryId ? selectedCategoryId : undefined,
        tags: f.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      }))
    };

    const success = await foodService.createBulkFoods(payload);
    setIsUploading(false);

    if (success) {
      toast.success(LABELS.RESTAURANT.UPLOAD_EXCEL.UPLOAD_SUCCESS(previewData.length));
      onSuccess();
      onClose();
    } else {
      toast.error(LABELS.RESTAURANT.UPLOAD_EXCEL.UPLOAD_ERROR);
    }
  };

  return (
    <div className="modal-backdrop">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="modal-card max-w-4xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-h2 flex items-center gap-3">
            <FileSpreadsheet className="text-emerald-500" /> {LABELS.RESTAURANT.UPLOAD_EXCEL.TITLE}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-all">
            <XCircle size={32} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Hướng dẫn + Tải file mẫu */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4 rounded-2xl text-emerald-800 dark:text-emerald-300 text-sm flex gap-4 items-start justify-between">
            <div>
              <p className="font-bold mb-2">{LABELS.RESTAURANT.UPLOAD_EXCEL.GUIDE_TITLE}</p>
              <ul className="list-disc pl-5 space-y-1 text-emerald-700 dark:text-emerald-400">
                <li>File Excel phải có đúng các cột: <strong>{LABELS.RESTAURANT.UPLOAD_EXCEL.COLS.NAME}, {LABELS.RESTAURANT.UPLOAD_EXCEL.COLS.PRICE}, {LABELS.RESTAURANT.UPLOAD_EXCEL.COLS.DESC}, {LABELS.RESTAURANT.UPLOAD_EXCEL.COLS.IMAGE}, {LABELS.RESTAURANT.UPLOAD_EXCEL.COLS.TAGS}</strong></li>
                <li><strong>{LABELS.RESTAURANT.UPLOAD_EXCEL.COLS.NAME}</strong> và <strong>{LABELS.RESTAURANT.UPLOAD_EXCEL.COLS.PRICE}</strong> là 2 cột bắt buộc.</li>
                <li>{LABELS.RESTAURANT.UPLOAD_EXCEL.COLS.TAGS} nhập nhiều giá trị cách nhau bởi dấu phẩy (vd: <em>Ăn vặt, Đồ uống</em>).</li>
                <li>Bạn chưa có file? Tải file mẫu về điền vào rồi upload lại.</li>
              </ul>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex-shrink-0 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-sm"
            >
              <Download size={14} /> {LABELS.RESTAURANT.UPLOAD_EXCEL.DOWNLOAD_BTN}
            </button>
          </div>

          {/* Bước 1 & 2: Chọn cơ sở và danh mục */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300">
                {LABELS.RESTAURANT.UPLOAD_EXCEL.STEP_1} <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedBranchId}
                onChange={e => setSelectedBranchId(parseInt(e.target.value))}
                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-2xl py-3 px-4 outline-none focus:border-primary transition-all text-sm font-semibold dark:text-white"
              >
                <option value="" disabled hidden>{LABELS.RESTAURANT.UPLOAD_EXCEL.SELECT_BRANCH}</option>
                {myBranches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300">
                {LABELS.RESTAURANT.UPLOAD_EXCEL.STEP_2} <span className="text-gray-400 font-normal">{LABELS.RESTAURANT.UPLOAD_EXCEL.OPTIONAL}</span>
              </label>
              <select
                value={selectedCategoryId}
                onChange={e => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : '')}
                disabled={!selectedBranchId || loadingCategories}
                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-2xl py-3 px-4 outline-none focus:border-primary transition-all text-sm font-semibold dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{LABELS.RESTAURANT.UPLOAD_EXCEL.SELECT_CATEGORY}</option>
                {flatCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    [{cat.groupName}] {cat.name}
                  </option>
                ))}
              </select>
              {selectedBranchId && flatCategories.length === 0 && !loadingCategories && (
                <p className="text-xs text-amber-500 mt-1">{LABELS.RESTAURANT.UPLOAD_EXCEL.NO_CATEGORY_WARN}</p>
              )}
              {loadingCategories && (
                <p className="text-xs text-gray-400 mt-1">{LABELS.RESTAURANT.UPLOAD_EXCEL.LOADING_CATEGORY}</p>
              )}
            </div>
          </div>

          {/* Bước 3: Chọn file */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 dark:text-slate-300">
              {LABELS.RESTAURANT.UPLOAD_EXCEL.STEP_3} <span className="text-rose-500">*</span>
            </label>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-2xl py-2 px-4 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-orange-600 transition-all text-sm font-semibold dark:text-slate-300"
            />
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="bg-gray-50 dark:bg-slate-900 px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-bold text-gray-700 dark:text-slate-300 text-sm">{LABELS.RESTAURANT.UPLOAD_EXCEL.PREVIEW_TITLE(previewData.length)}</span>
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 text-gray-500 font-semibold sticky top-0">
                      <th className="p-3">{LABELS.RESTAURANT.UPLOAD_EXCEL.COLS.NAME}</th>
                      <th className="p-3">{LABELS.RESTAURANT.UPLOAD_EXCEL.COLS.PRICE}</th>
                      <th className="p-3">{LABELS.RESTAURANT.UPLOAD_EXCEL.COLS.DESC}</th>
                      <th className="p-3">{LABELS.RESTAURANT.UPLOAD_EXCEL.COLS.TAGS}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-semibold text-gray-800 dark:text-slate-200">{row.name}</td>
                        <td className="p-3 text-primary font-bold">{row.price.toLocaleString()}đ</td>
                        <td className="p-3 text-gray-500 truncate max-w-[150px]">{row.description}</td>
                        <td className="p-3 text-gray-500">{row.tags}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <Button type="button" variant="outline" fullWidth onClick={onClose}>{LABELS.COMMON.CANCEL}</Button>
            <Button
              type="button"
              fullWidth
              onClick={handleSubmit}
              disabled={previewData.length === 0 || !selectedBranchId || isUploading}
              className={previewData.length > 0 ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              {isUploading ? LABELS.RESTAURANT.UPLOAD_EXCEL.SAVING : LABELS.RESTAURANT.UPLOAD_EXCEL.SAVE_BTN(previewData.length)}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
