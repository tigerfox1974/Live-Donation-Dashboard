import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode
} from 'react';
import { DonationItem } from '../types';
import { appendAuditLog, AuditActions } from '../lib/auditLog';

// ============ Types ============
interface ItemsContextType {
  items: DonationItem[];
  activeItemId: string | null;
  isFinalScreen: boolean;
  isTransitioning: boolean;
  transitionCountdown: number;
  
  // Actions
  setActiveItem: (itemId: string) => void;
  setFinalScreen: (show: boolean) => void;
  setIsTransitioning: (value: boolean) => void;
  setTransitionCountdown: (value: number) => void;
  goToNextItem: () => void;
  goToPrevItem: () => void;
  addItem: (item: Omit<DonationItem, 'id'>) => void;
  updateItem: (id: string, data: Partial<DonationItem>) => void;
  deleteItem: (id: string) => void;
  reorderItems: (itemId: string, direction: 'up' | 'down') => void;
  
  // Computed
  getActiveItem: () => DonationItem | undefined;
  sortedItems: DonationItem[];
}

interface ItemsProviderProps {
  children: ReactNode;
  items: DonationItem[];
  setItems: React.Dispatch<React.SetStateAction<DonationItem[]>>;
  activeItemId: string | null;
  setActiveItemId: React.Dispatch<React.SetStateAction<string | null>>;
  isFinalScreen: boolean;
  setIsFinalScreen: React.Dispatch<React.SetStateAction<boolean>>;
  isTransitioning: boolean;
  setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>;
  transitionCountdown: number;
  setTransitionCountdown: React.Dispatch<React.SetStateAction<number>>;
  activeEventId: string | null;
}

// ============ Context ============
const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

// ============ Provider ============
export function ItemsProvider({
  children,
  items,
  setItems,
  activeItemId,
  setActiveItemId,
  isFinalScreen,
  setIsFinalScreen,
  isTransitioning,
  setIsTransitioning,
  transitionCountdown,
  setTransitionCountdown,
  activeEventId
}: ItemsProviderProps) {
  
  // Memoized sorted items
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.order - b.order);
  }, [items]);
  
  const setActiveItem = useCallback((itemId: string) => {
    setActiveItemId(itemId);
    setIsFinalScreen(false);
    setIsTransitioning(false);
    setTransitionCountdown(0);
  }, [setActiveItemId, setIsFinalScreen, setIsTransitioning, setTransitionCountdown]);
  
  const setFinalScreen = useCallback((show: boolean) => {
    setIsFinalScreen(show);
  }, [setIsFinalScreen]);
  
  const goToNextItem = useCallback(() => {
    const currentIndex = sortedItems.findIndex((i) => i.id === activeItemId);
    if (currentIndex < sortedItems.length - 1) {
      setActiveItemId(sortedItems[currentIndex + 1].id);
      setIsTransitioning(false);
      setTransitionCountdown(0);
    }
  }, [sortedItems, activeItemId, setActiveItemId, setIsTransitioning, setTransitionCountdown]);
  
  const goToPrevItem = useCallback(() => {
    const currentIndex = sortedItems.findIndex((i) => i.id === activeItemId);
    if (currentIndex > 0) {
      setActiveItemId(sortedItems[currentIndex - 1].id);
      setIsTransitioning(false);
      setTransitionCountdown(0);
    }
  }, [sortedItems, activeItemId, setActiveItemId, setIsTransitioning, setTransitionCountdown]);
  
  const addItem = useCallback((item: Omit<DonationItem, 'id'>) => {
    const newItem: DonationItem = {
      ...item,
      id: `item-${Date.now()}`,
      eventId: item.eventId || activeEventId || undefined
    };
    setItems((prev) => [...prev, newItem]);
    
    if (activeEventId) {
      appendAuditLog({
        eventId: activeEventId,
        action: AuditActions.ITEM_ADDED,
        details: newItem.name
      });
    }
  }, [setItems, activeEventId]);
  
  const updateItem = useCallback((id: string, data: Partial<DonationItem>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...data } : item
      )
    );
  }, [setItems]);
  
  const deleteItem = useCallback((id: string) => {
    setItems((prev) => {
      const deletedItem = prev.find(item => item.id === id);
      const remaining = prev.filter((item) => item.id !== id);
      
      if (activeItemId === id) {
        setActiveItemId(remaining.length > 0 ? remaining[0].id : null);
      }
      
      if (activeEventId && deletedItem) {
        appendAuditLog({
          eventId: activeEventId,
          action: AuditActions.ITEM_DELETED,
          details: deletedItem.name
        });
      }
      
      return remaining;
    });
  }, [setItems, activeItemId, setActiveItemId, activeEventId]);
  
  const reorderItems = useCallback((itemId: string, direction: 'up' | 'down') => {
    setItems((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((i) => i.id === itemId);
      if (index === -1) return prev;
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= sorted.length) return prev;
      
      return sorted.map((item, i) => {
        if (i === index) {
          return { ...item, order: sorted[swapIndex].order };
        }
        if (i === swapIndex) {
          return { ...item, order: sorted[index].order };
        }
        return item;
      });
    });
  }, [setItems]);
  
  const getActiveItem = useCallback(() => {
    return items.find((i) => i.id === activeItemId);
  }, [items, activeItemId]);
  
  const value = useMemo<ItemsContextType>(() => ({
    items,
    activeItemId,
    isFinalScreen,
    isTransitioning,
    transitionCountdown,
    setActiveItem,
    setFinalScreen,
    setIsTransitioning,
    setTransitionCountdown,
    goToNextItem,
    goToPrevItem,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    getActiveItem,
    sortedItems
  }), [
    items,
    activeItemId,
    isFinalScreen,
    isTransitioning,
    transitionCountdown,
    setActiveItem,
    setFinalScreen,
    setIsTransitioning,
    setTransitionCountdown,
    goToNextItem,
    goToPrevItem,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    getActiveItem,
    sortedItems
  ]);
  
  return (
    <ItemsContext.Provider value={value}>
      {children}
    </ItemsContext.Provider>
  );
}

// ============ Hooks ============
export function useItems() {
  const context = useContext(ItemsContext);
  if (context === undefined) {
    throw new Error('useItems must be used within an ItemsProvider');
  }
  return context;
}

// Selector hooks for preventing unnecessary re-renders
export function useItemsData() {
  const { items, sortedItems } = useItems();
  return useMemo(() => ({ items, sortedItems }), [items, sortedItems]);
}

export function useActiveItem() {
  const { activeItemId, getActiveItem, setActiveItem, isFinalScreen, setFinalScreen } = useItems();
  return useMemo(() => ({
    activeItemId,
    activeItem: getActiveItem(),
    setActiveItem,
    isFinalScreen,
    setFinalScreen
  }), [activeItemId, getActiveItem, setActiveItem, isFinalScreen, setFinalScreen]);
}

export function useItemNavigation() {
  const { goToNextItem, goToPrevItem, isTransitioning, setIsTransitioning, transitionCountdown, setTransitionCountdown } = useItems();
  return useMemo(() => ({
    goToNextItem,
    goToPrevItem,
    isTransitioning,
    setIsTransitioning,
    transitionCountdown,
    setTransitionCountdown
  }), [goToNextItem, goToPrevItem, isTransitioning, setIsTransitioning, transitionCountdown, setTransitionCountdown]);
}

export function useItemActions() {
  const { addItem, updateItem, deleteItem, reorderItems } = useItems();
  return useMemo(() => ({
    addItem,
    updateItem,
    deleteItem,
    reorderItems
  }), [addItem, updateItem, deleteItem, reorderItems]);
}
