import React, { useState, useEffect, useRef } from 'react';
import { Utensils } from 'lucide-react';
import { Input } from './Input';
import { SafeImage } from './SafeImage';

export interface LinkableFood {
  id: number;
  name: string;
  image?: string | null;
}

interface FoodSelectAutocompleteProps {
  foods: LinkableFood[];
  selectedFoodId: string;
  onSelectFood: (id: string, name: string, image?: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const FoodSelectAutocomplete: React.FC<FoodSelectAutocompleteProps> = ({
  foods,
  selectedFoodId,
  onSelectFood,
  disabled,
  placeholder = "-- Tìm kiếm món ăn --",
}) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Khởi tạo tên tìm kiếm nếu đã có selectedFoodId (khi render lại)
  useEffect(() => {
    if (selectedFoodId) {
      const selected = foods.find(f => f.id.toString() === selectedFoodId);
      if (selected && search !== selected.name) {
        setSearch(selected.name);
      }
    } else {
      setSearch('');
    }
  }, [selectedFoodId, foods]); // eslint-disable-line react-hooks/exhaustive-deps

  // Xử lý click ra ngoài để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (!selectedFoodId) setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedFoodId]);

  const filteredFoods = foods
    .filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 5);

  return (
    <div className="relative" ref={containerRef}>
      <Input
        variant="none"
        className="form-input w-full bg-none cursor-pointer"
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          if (selectedFoodId) {
            // Khi gõ text mới thì reset id đã chọn
            onSelectFood('', '');
          }
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        disabled={disabled}
      />
      
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-lg z-[9999] max-h-60 overflow-y-auto">
          <button
            type="button"
            className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
            onClick={() => {
              onSelectFood('', '');
              setSearch('');
              setIsOpen(false);
            }}
          >
            -- Không liên kết --
          </button>
          
          {filteredFoods.map((f) => (
            <button
              key={f.id}
              type="button"
              className="w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
              onClick={() => {
                onSelectFood(f.id.toString(), f.name, f.image);
                setSearch(f.name);
                setIsOpen(false);
              }}
            >
              {f.image ? (
                <div className="w-8 h-8 rounded bg-gray-100 flex-shrink-0 relative overflow-hidden">
                  <SafeImage src={f.image} alt={f.name} fill className="object-cover" sizes="32px" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded bg-gray-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Utensils size={14} className="text-gray-400" />
                </div>
              )}
              <span className="truncate">{f.name}</span>
            </button>
          ))}
          
          {filteredFoods.length === 0 && search && (
            <div className="px-4 py-3 text-sm text-gray-400 italic text-center">Không tìm thấy món ăn nào</div>
          )}
        </div>
      )}
    </div>
  );
};
