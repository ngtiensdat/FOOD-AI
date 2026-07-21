import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/store/useToastStore';
import { inventoryService, Ingredient, RecipeGroup, InventoryLog } from '@/services/inventory.service';
import { Restaurant } from '@/types/restaurant';
import { LABELS } from '@/constants/labels';

export type InventoryTab = 'ingredients' | 'recipes' | 'logs';

interface UseInventoryParams {
  restaurant: Restaurant | null;
  myBranches: Restaurant[];
}

export function useInventory({ restaurant, myBranches }: UseInventoryParams) {
  const t = LABELS.INVENTORY_MANAGER;
  
  const [selectedBranchId, setSelectedBranchId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<InventoryTab>('ingredients');

  // Data states
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<RecipeGroup[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);

  // Ingredient Form State
  const [currentIngredientId, setCurrentIngredientId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [minStock, setMinStock] = useState(0);

  // Import Form State
  const [importIngredientId, setImportIngredientId] = useState('');
  const [importQty, setImportQty] = useState(0);
  const [importNote, setImportNote] = useState('');

  // Recipe Form State
  const [currentFoodId, setCurrentFoodId] = useState<number | null>(null);
  const [currentFoodName, setCurrentFoodName] = useState('');
  const [recipeItems, setRecipeItems] = useState<{ ingredientId: string; usedQuantity: number }[]>([]);

  // Sync selected branch
  useEffect(() => {
    if (myBranches.length > 0 && selectedBranchId === 0) {
      setSelectedBranchId(myBranches[0].id);
    } else if (restaurant && selectedBranchId === 0) {
      setSelectedBranchId(restaurant.id);
    }
  }, [myBranches, restaurant, selectedBranchId]);

  // Load data based on tab & branch
  const loadData = useCallback(async () => {
    if (selectedBranchId === 0) return;
    try {
      if (activeTab === 'ingredients') {
        const data = await inventoryService.getIngredients(selectedBranchId);
        setIngredients(data);
      } else if (activeTab === 'recipes') {
        const data = await inventoryService.getRecipes(selectedBranchId);
        setRecipes(data);
      } else if (activeTab === 'logs') {
        const data = await inventoryService.getLogs(selectedBranchId);
        setLogs(data);
      }
    } catch (error) {
      console.error('Failed to load inventory data:', error);
      toast.error(t.TOAST.LOAD_ERROR);
    }
  }, [selectedBranchId, activeTab, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAddModal = () => {
    setName('');
    setSku('');
    setUnit('kg');
    setQuantity(0);
    setMinStock(1);
    setIsAddModalOpen(true);
  };

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !unit.trim()) {
      toast.error(t.TOAST.EMPTY_NAME_UNIT);
      return;
    }
    try {
      await inventoryService.createIngredient({
        name: name.trim(),
        sku: sku.trim() || undefined,
        quantity: quantity,
        unit: unit.trim(),
        minStock: minStock,
      }, selectedBranchId);
      toast.success(t.TOAST.CREATE_SUCCESS(name));
      setIsAddModalOpen(false);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.TOAST.CREATE_ERROR);
    }
  };

  const handleOpenEditModal = (ing: Ingredient) => {
    setCurrentIngredientId(ing.id);
    setName(ing.name);
    setSku(ing.sku || '');
    setUnit(ing.unit);
    setQuantity(ing.quantity);
    setMinStock(ing.minStock);
    setIsEditModalOpen(true);
  };

  const handleUpdateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentIngredientId) return;
    try {
      await inventoryService.updateIngredient(currentIngredientId, {
        name: name.trim(),
        sku: sku.trim() || undefined,
        quantity,
        unit: unit.trim(),
        minStock,
      }, selectedBranchId);
      toast.success(t.TOAST.UPDATE_SUCCESS);
      setIsEditModalOpen(false);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.TOAST.UPDATE_ERROR);
    }
  };

  const handleDeleteIngredient = async (id: string, ingName: string) => {
    const confirm = window.confirm(t.TOAST.DELETE_CONFIRM(ingName));
    if (confirm) {
      try {
        await inventoryService.deleteIngredient(id, selectedBranchId);
        toast.success(t.TOAST.DELETE_SUCCESS(ingName));
        loadData();
      } catch (error) {
        toast.error(t.TOAST.DELETE_ERROR);
      }
    }
  };

  const handleOpenImportModal = (ing?: Ingredient) => {
    setImportIngredientId(ing?.id || ingredients[0]?.id || '');
    setImportQty(5);
    setImportNote('');
    setIsImportModalOpen(true);
  };

  const handleImportIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importIngredientId) {
      toast.error(t.TOAST.SELECT_INGREDIENT);
      return;
    }
    if (importQty <= 0) {
      toast.error(t.TOAST.INVALID_QTY);
      return;
    }
    try {
      await inventoryService.importIngredient({
        ingredientId: importIngredientId,
        quantity: importQty,
        note: importNote.trim() || undefined,
      }, selectedBranchId);
      toast.success(t.TOAST.IMPORT_SUCCESS);
      setIsImportModalOpen(false);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.TOAST.IMPORT_ERROR);
    }
  };

  const handleOpenRecipeModal = (recipeGroup: RecipeGroup) => {
    setCurrentFoodId(recipeGroup.foodId);
    setCurrentFoodName(recipeGroup.foodName);
    
    const items = recipeGroup.items.map((i) => ({
      ingredientId: i.ingredientId,
      usedQuantity: i.usedQuantity,
    }));
    setRecipeItems(items.length > 0 ? items : [{ ingredientId: ingredients[0]?.id || '', usedQuantity: 0.1 }]);
    setIsRecipeModalOpen(true);
  };

  const handleAddRecipeRow = () => {
    if (ingredients.length === 0) return;
    setRecipeItems([...recipeItems, { ingredientId: ingredients[0].id, usedQuantity: 0.1 }]);
  };

  const handleRemoveRecipeRow = (index: number) => {
    const updated = [...recipeItems];
    updated.splice(index, 1);
    setRecipeItems(updated);
  };

  const handleRecipeRowChange = (index: number, field: 'ingredientId' | 'usedQuantity', value: string | number) => {
    const updated = [...recipeItems];
    if (field === 'usedQuantity') {
      const numVal = typeof value === 'number' ? value : parseFloat(value) || 0;
      updated[index] = { ...updated[index], usedQuantity: numVal };
    } else {
      updated[index] = { ...updated[index], ingredientId: String(value) };
    }
    setRecipeItems(updated);
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFoodId) return;

    const validItems = recipeItems.filter(item => item.ingredientId && item.usedQuantity > 0);

    try {
      await inventoryService.updateRecipe({
        foodId: currentFoodId,
        items: validItems,
      }, selectedBranchId);
      toast.success(t.TOAST.RECIPE_SAVE_SUCCESS(currentFoodName));
      setIsRecipeModalOpen(false);
      loadData();
    } catch (error) {
      toast.error(t.TOAST.RECIPE_SAVE_ERROR);
    }
  };

  return {
    // Branch
    selectedBranchId,
    setSelectedBranchId,
    activeTab,
    setActiveTab,
    loadData,

    // Data
    ingredients,
    recipes,
    logs,

    // Modals
    isAddModalOpen, setIsAddModalOpen,
    isEditModalOpen, setIsEditModalOpen,
    isImportModalOpen, setIsImportModalOpen,
    isRecipeModalOpen, setIsRecipeModalOpen,
    isImportExcelOpen, setIsImportExcelOpen,

    // Ingredient Form
    name, setName,
    sku, setSku,
    unit, setUnit,
    quantity, setQuantity,
    minStock, setMinStock,

    // Import Form
    importIngredientId, setImportIngredientId,
    importQty, setImportQty,
    importNote, setImportNote,

    // Recipe Form
    currentFoodId,
    currentFoodName,
    recipeItems,

    // Handlers
    handleOpenAddModal,
    handleCreateIngredient,
    handleOpenEditModal,
    handleUpdateIngredient,
    handleDeleteIngredient,
    handleOpenImportModal,
    handleImportIngredient,
    handleOpenRecipeModal,
    handleAddRecipeRow,
    handleRemoveRecipeRow,
    handleRecipeRowChange,
    handleSaveRecipe,
  };
}
