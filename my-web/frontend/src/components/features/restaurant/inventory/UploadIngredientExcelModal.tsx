import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { XCircle, FileSpreadsheet, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/base/Button';
import { Input } from '@/components/base/Input';
import * as XLSX from 'xlsx';
import { inventoryService } from '@/services/inventory.service';
import { toast } from '@/store/useToastStore';
import { LABELS } from '@/constants/labels';
import { EXCEL_INGREDIENT_SAMPLE_DATA } from '@/constants/excel.constant';
import { Restaurant } from '@/types/restaurant';

interface UploadIngredientExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  myBranches: Restaurant[];
  onSuccess: () => void;
}

interface PreviewIngredient {
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  minStock: number;
}

export const UploadIngredientExcelModal = ({ isOpen, onClose, myBranches, onSuccess }: UploadIngredientExcelModalProps) => {
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('');
  const [previewData, setPreviewData] = useState<PreviewIngredient[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Auto select branch if only 1 exists
  useEffect(() => {
    if (myBranches && myBranches.length === 1 && !selectedBranchId) {
      setSelectedBranchId(myBranches[0].id);
    }
  }, [myBranches, selectedBranchId]);

  if (!isOpen) return null;

  // Download template excel file
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(EXCEL_INGREDIENT_SAMPLE_DATA);
    ws['!cols'] = [
      { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.SHEET_NAME);
    XLSX.writeFile(wb, LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.FILE_NAME);
    toast.success(LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.DOWNLOAD_SUCCESS);
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
        const { COLS } = LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL;

        // Map column values from Excel
        const mappedData = data.map(row => {
          // Normalize unit values to DB expectations
          let rawUnit = String(row[COLS.UNIT] || row['Unit'] || 'kg').trim().toLowerCase();
          if (rawUnit === 'liter' || rawUnit === 'l') rawUnit = 'lít';
          if (rawUnit === 'piece' || rawUnit === 'pcs') rawUnit = 'cái';
          if (rawUnit === 'gram' || rawUnit === 'g') rawUnit = 'gam';
          if (rawUnit === 'box' || rawUnit === 'carton') rawUnit = 'hộp';

          return {
            name: String(row[COLS.NAME] || row['Name'] || row['Ingredient Name'] || ''),
            sku: String(row[COLS.SKU] || row['SKU'] || ''),
            quantity: Number(row[COLS.QTY] || row['Quantity'] || row['Qty'] || 0),
            unit: rawUnit,
            minStock: Number(row[COLS.MIN_STOCK] || row['Min Stock'] || row['MinStock'] || 0),
          };
        }).filter(item => item.name.trim() !== '');

        if (mappedData.length === 0) {
          return toast.error(LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.INVALID_DATA);
        }
        setPreviewData(mappedData);
        toast.success(LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.READ_SUCCESS(mappedData.length));
      } catch (error) {
        toast.error(LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.READ_ERROR);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async () => {
    if (!selectedBranchId) {
      return toast.error(LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.BRANCH_REQUIRED);
    }
    if (previewData.length === 0) {
      return toast.error(LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.EMPTY_DATA);
    }

    setIsUploading(true);
    const payload = {
      restaurantId: selectedBranchId,
      ingredients: previewData.map(item => ({
        name: item.name,
        sku: item.sku ? item.sku : undefined,
        quantity: item.quantity,
        unit: item.unit ? item.unit : 'kg',
        minStock: item.minStock
      }))
    };

    const result = await inventoryService.createBulkIngredients(payload, selectedBranchId);
    setIsUploading(false);

    if (result && result.success) {
      toast.success(LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.UPLOAD_SUCCESS(previewData.length));
      onSuccess();
      onClose();
    } else {
      toast.error(LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.UPLOAD_ERROR);
    }
  };

  return (
    <div className="modal-wrapper">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="modal-overlay"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="modal-card max-w-4xl w-full relative z-10"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-h2 flex items-center gap-3">
            <FileSpreadsheet className="text-primary" /> {LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.TITLE}
          </h3>
          <Button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-all" variant="none" size="none">
            <XCircle size={32} />
          </Button>
        </div>

        <div className="space-y-5">
          {/* Guide section */}
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 p-4 rounded-2xl text-primary dark:text-primary-light text-sm flex gap-4 items-start justify-between">
            <div>
              <p className="font-bold mb-2">{LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.GUIDE_TITLE}</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-500 dark:text-slate-400">
                <li>{LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.GUIDES.COLS_INFO} <strong>{Object.values(LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.COLS).join(', ')}</strong></li>
                <li>{LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.GUIDES.REQUIRED_INFO(LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.COLS.NAME, LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.COLS.UNIT)}</li>
                <li>{LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.GUIDES.UNIT_INFO}</li>
                <li>{LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.GUIDES.NO_FILE}</li>
              </ul>
            </div>
            <Button
              onClick={handleDownloadTemplate}
              className="flex-shrink-0 flex items-center gap-2 bg-primary hover:bg-primary-light text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-md"
              variant="none"
              size="none"
            >
              <Download size={14} /> {LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.DOWNLOAD_BTN}
            </Button>
          </div>

          {/* Select branch */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 dark:text-slate-300">
              {LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.STEP_1} <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={selectedBranchId}
              onChange={e => setSelectedBranchId(parseInt(e.target.value))}
              className="form-input py-3 px-4 rounded-2xl text-sm font-semibold dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
            >
              <option value="" disabled hidden>{LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.SELECT_BRANCH}</option>
              {myBranches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          {/* Select file */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 dark:text-slate-300">
              {LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.STEP_2} <span className="text-rose-500">*</span>
            </label>
            <Input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              variant="none"
              className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-2xl py-2 px-4 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-orange-600 transition-all text-sm font-semibold dark:text-slate-300"
            />
          </div>

          {/* Preview grid */}
          {previewData.length > 0 && (
            <div className="border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="bg-gray-50 dark:bg-slate-900 px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-bold text-gray-700 dark:text-slate-300 text-sm">{LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.PREVIEW_TITLE(previewData.length)}</span>
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 text-gray-500 font-semibold sticky top-0">
                      <th className="p-3">{LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.COLS.NAME}</th>
                      <th className="p-3">{LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.COLS.SKU}</th>
                      <th className="p-3">{LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.COLS.QTY}</th>
                      <th className="p-3">{LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.COLS.UNIT}</th>
                      <th className="p-3">{LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.COLS.MIN_STOCK}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-semibold text-gray-800 dark:text-slate-200">{row.name}</td>
                        <td className="p-3 text-gray-500 font-semibold">{row.sku || '-'}</td>
                        <td className="p-3 text-primary font-bold">{row.quantity}</td>
                        <td className="p-3 text-gray-800 dark:text-slate-250 font-bold">{row.unit}</td>
                        <td className="p-3 text-amber-600 dark:text-amber-450 font-semibold">{row.minStock}</td>
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
              className={previewData.length > 0 ? "bg-primary hover:bg-primary-light text-white font-bold" : ""}
            >
              {isUploading ? LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.SAVING : LABELS.RESTAURANT.UPLOAD_INGREDIENT_EXCEL.SAVE_BTN(previewData.length)}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
