import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  createContext,
  useContext,
  ReactNode
} from 'react';
import { Donation, DonationItem, EventContextType, EventData, Participant } from '../types';

const buildEventStorageKey = (eventId: string, suffix: string) =>
  `polvak_event_${eventId}_${suffix}`;
const getEventItemsKey = (eventId: string) =>
  buildEventStorageKey(eventId, 'items');
const getEventParticipantsKey = (eventId: string) =>
  buildEventStorageKey(eventId, 'participants');
const getEventDonationsKey = (eventId: string) =>
  buildEventStorageKey(eventId, 'donations');
const getEventActiveItemKey = (eventId: string) =>
  buildEventStorageKey(eventId, 'active_item');

const generateToken = () => {
  const random = Math.random().toString(36).slice(2, 10);
  return `t-${Date.now()}-${random}`;
};

const ensureParticipantTokens = (list: Participant[], eventId: string) => {
  return list.map((p) => ({
    ...p,
    token: p.token || generateToken(),
    eventId: p.eventId || eventId
  }));
};

const readStorageArray = <T,>(key: string): T[] | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
};

const readStorageValue = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

interface ExtendedEventContextType extends EventContextType {
  isTransitioning: boolean;
  setIsTransitioning: (value: boolean) => void;
  transitionCountdown: number;
  setTransitionCountdown: (value: number) => void;
  goToNextItem: () => void;
  goToPrevItem: () => void;
  canAcceptDonations: boolean;
}
const EventContext = createContext<ExtendedEventContextType | undefined>(
  undefined
);

interface EventProviderProps {
  children: ReactNode;
  activeEventId: string | null;
  eventDataMap: Map<string, EventData>;
  onEventDataMapChange: React.Dispatch<React.SetStateAction<Map<string, EventData>>>;
  onEventDataChange?: (eventData: EventData) => void;
}

export function EventProvider({
  children,
  activeEventId,
  eventDataMap,
  onEventDataMapChange,
  onEventDataChange
}: EventProviderProps) {
  const [items, setItems] = useState<DonationItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isFinalScreen, setIsFinalScreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionCountdown, setTransitionCountdown] = useState(0);
  const [isHydrating, setIsHydrating] = useState(true);
  const canAcceptDonations = !isTransitioning;
  const eventDataMapRef = useRef(eventDataMap);

  useEffect(() => {
    eventDataMapRef.current = eventDataMap;
  }, [eventDataMap]);

  useEffect(() => {
    setIsHydrating(true);
    if (!activeEventId) {
      setItems([]);
      setParticipants([]);
      setDonations([]);
      setActiveItemId(null);
      setIsFinalScreen(false);
      setIsTransitioning(false);
      setTransitionCountdown(0);
      setIsHydrating(false);
      return;
    }

    const fromMap = eventDataMapRef.current.get(activeEventId);
    const storedItems = readStorageArray<DonationItem>(
      getEventItemsKey(activeEventId)
    );
    const storedParticipants = readStorageArray<Participant>(
      getEventParticipantsKey(activeEventId)
    );
    const storedDonations = readStorageArray<Donation>(
      getEventDonationsKey(activeEventId)
    );

    const baseItems =
      storedItems && storedItems.length > 0 ?
      storedItems :
      fromMap?.items ||
      [];
    const baseParticipants =
      storedParticipants && storedParticipants.length > 0 ?
      storedParticipants :
      fromMap?.participants ||
      [];
    const baseDonations =
      storedDonations && storedDonations.length > 0 ?
      storedDonations :
      fromMap?.donations ||
      [];

    setItems(baseItems);
    setParticipants(ensureParticipantTokens(baseParticipants, activeEventId));
    setDonations(baseDonations);

    const storedActiveItemId = readStorageValue(
      getEventActiveItemKey(activeEventId)
    );
    const nextActiveItemId =
      storedActiveItemId && baseItems.some((item) => item.id === storedActiveItemId) ?
      storedActiveItemId :
      baseItems[0]?.id ||
      null;

    setActiveItemId(nextActiveItemId);
    setIsFinalScreen(false);
    setIsTransitioning(false);
    setTransitionCountdown(0);
    setIsHydrating(false);
  }, [activeEventId]);

  useEffect(() => {
    if (!activeEventId) return;
    const handleStorage = (event: StorageEvent) => {
      if (!event.key) return;
      const itemsKey = getEventItemsKey(activeEventId);
      const participantsKey = getEventParticipantsKey(activeEventId);
      const donationsKey = getEventDonationsKey(activeEventId);
      const activeItemKey = getEventActiveItemKey(activeEventId);
      if (
        event.key !== itemsKey &&
        event.key !== participantsKey &&
        event.key !== donationsKey &&
        event.key !== activeItemKey
      ) {
        return;
      }
      if (event.key === itemsKey) {
        const nextItems = readStorageArray<DonationItem>(itemsKey) || [];
        setItems(nextItems);
      }
      if (event.key === participantsKey) {
        const nextParticipants =
          readStorageArray<Participant>(participantsKey) || [];
        setParticipants(ensureParticipantTokens(nextParticipants, activeEventId));
      }
      if (event.key === donationsKey) {
        const nextDonations = readStorageArray<Donation>(donationsKey) || [];
        setDonations(nextDonations);
      }
      if (event.key === activeItemKey) {
        const nextActiveItemId = readStorageValue(activeItemKey);
        setActiveItemId(nextActiveItemId || null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [activeEventId]);

  useEffect(() => {
    if (!activeEventId) return;
    try {
      localStorage.setItem(
        getEventItemsKey(activeEventId),
        JSON.stringify(items)
      );
    } catch {
      // no-op
    }
  }, [activeEventId, items]);

  useEffect(() => {
    if (!activeEventId) return;
    try {
      localStorage.setItem(
        getEventParticipantsKey(activeEventId),
        JSON.stringify(participants)
      );
    } catch {
      // no-op
    }
  }, [activeEventId, participants]);

  useEffect(() => {
    if (!activeEventId) return;
    try {
      localStorage.setItem(
        getEventDonationsKey(activeEventId),
        JSON.stringify(donations)
      );
    } catch {
      // no-op
    }
  }, [activeEventId, donations]);

  useEffect(() => {
    if (!activeEventId) return;
    try {
      const key = getEventActiveItemKey(activeEventId);
      if (activeItemId) {
        localStorage.setItem(key, activeItemId);
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // no-op
    }
  }, [activeEventId, activeItemId]);

  useEffect(() => {
    if (!activeEventId) return;
    const payload: EventData = {
      eventId: activeEventId,
      items,
      participants,
      donations
    };
    onEventDataMapChange((prev) => {
      const next = new Map(prev);
      next.set(activeEventId, payload);
      return next;
    });
    if (onEventDataChange) {
      onEventDataChange(payload);
    }
  }, [activeEventId, items, participants, donations, onEventDataMapChange, onEventDataChange]);

  useEffect(() => {
    if (!items.length) {
      if (activeItemId !== null) {
        setActiveItemId(null);
      }
      return;
    }
    if (activeItemId && items.some((item) => item.id === activeItemId)) {
      return;
    }
    setActiveItemId(items[0].id);
  }, [items, activeItemId]);

  const addDonation = (participantId: string, quantity: number) => {
    if (!activeItemId) return false;
    if (!canAcceptDonations) return false;
    const newDonation: Donation = {
      id: `d-${Date.now()}`,
      participant_id: participantId,
      item_id: activeItemId,
      quantity,
      status: 'pending',
      timestamp: Date.now()
    };
    setDonations((prev) => [newDonation, ...prev]);
    return true;
  };

  const approveDonation = (donationId: string) => {
    setDonations((prev) =>
      prev.map((d) =>
        d.id === donationId
          ? {
              ...d,
              status: 'approved'
            }
          : d
      )
    );
  };

  const rejectDonation = (donationId: string) => {
    setDonations((prev) =>
      prev.map((d) =>
        d.id === donationId
          ? {
              ...d,
              status: 'rejected'
            }
          : d
      )
    );
  };

  const undoLastApproval = () => {
    const sortedApproved = [...donations]
      .filter((d) => d.status === 'approved')
      .sort((a, b) => b.timestamp - a.timestamp);
    if (sortedApproved.length > 0) {
      const lastId = sortedApproved[0].id;
      setDonations((prev) =>
        prev.map((d) =>
          d.id === lastId
            ? {
                ...d,
                status: 'pending'
              }
            : d
        )
      );
    }
  };

  const setActiveItem = (itemId: string) => {
    setActiveItemId(itemId);
    setIsFinalScreen(false);
    setIsTransitioning(false);
    setTransitionCountdown(0);
  };

  const setFinalScreen = (show: boolean) => {
    setIsFinalScreen(show);
  };

  const goToNextItem = useCallback(() => {
    const sortedItems = [...items].sort((a, b) => a.order - b.order);
    const currentIndex = sortedItems.findIndex((i) => i.id === activeItemId);
    if (currentIndex < sortedItems.length - 1) {
      setActiveItemId(sortedItems[currentIndex + 1].id);
      setIsTransitioning(false);
      setTransitionCountdown(0);
    }
  }, [items, activeItemId]);

  const goToPrevItem = useCallback(() => {
    const sortedItems = [...items].sort((a, b) => a.order - b.order);
    const currentIndex = sortedItems.findIndex((i) => i.id === activeItemId);
    if (currentIndex > 0) {
      setActiveItemId(sortedItems[currentIndex - 1].id);
      setIsTransitioning(false);
      setTransitionCountdown(0);
    }
  }, [items, activeItemId]);

  const addItem = (item: Omit<DonationItem, 'id'>) => {
    const newItem = {
      ...item,
      id: `item-${Date.now()}`,
      eventId: item.eventId || activeEventId || item.eventId
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (id: string, data: Partial<DonationItem>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...data
            }
          : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => {
      const remaining = prev.filter((item) => item.id !== id);
      if (activeItemId === id) {
        setActiveItemId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  const reorderItems = (itemId: string, direction: 'up' | 'down') => {
    setItems((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((i) => i.id === itemId);
      if (index === -1) return prev;
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= sorted.length) return prev;
      const newOrder = [...sorted];
      const tempOrder = newOrder[index].order;
      newOrder[index] = {
        ...newOrder[index],
        order: newOrder[swapIndex].order
      };
      newOrder[swapIndex] = {
        ...newOrder[swapIndex],
        order: tempOrder
      };
      return newOrder;
    });
  };

  const addParticipant = (participant: Omit<Participant, 'id'>) => {
    const newParticipant = {
      ...participant,
      id: `p-${Date.now()}`,
      token: participant.token || generateToken(),
      eventId: participant.eventId || activeEventId || participant.eventId
    };
    setParticipants((prev) => [...prev, newParticipant]);
  };

  const updateParticipant = (id: string, data: Partial<Participant>) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...data,
              token: data.token ?? p.token ?? generateToken(),
              eventId: data.eventId ?? p.eventId ?? activeEventId ?? p.eventId
            }
          : p
      )
    );
  };

  const deleteParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const getDonationsByItem = (itemId: string) => {
    return donations.filter(
      (d) => d.item_id === itemId && d.status === 'approved'
    );
  };

  const getItemTotal = (itemId: string) => {
    return getDonationsByItem(itemId).reduce((sum, d) => sum + d.quantity, 0);
  };

  const getGrandTotal = () => {
    return donations
      .filter((d) => d.status === 'approved')
      .reduce((sum, d) => sum + d.quantity, 0);
  };

  const getGrandTarget = () => {
    return items.reduce((sum, item) => sum + item.initial_target, 0);
  };

  const getActiveItem = () => {
    return items.find((i) => i.id === activeItemId);
  };

  const getParticipantTotal = (participantId: string) => {
    return donations
      .filter(
        (d) => d.participant_id === participantId && d.status === 'approved'
      )
      .reduce((sum, d) => sum + d.quantity, 0);
  };

  return (
    <EventContext.Provider
      value={{
        items,
        participants,
        donations,
        activeItemId,
        isFinalScreen,
        isTransitioning,
        setIsTransitioning,
        transitionCountdown,
        setTransitionCountdown,
        canAcceptDonations,
        addDonation,
        approveDonation,
        rejectDonation,
        undoLastApproval,
        setActiveItem,
        setFinalScreen,
        goToNextItem,
        goToPrevItem,
        addParticipant,
        updateParticipant,
        deleteParticipant,
        addItem,
        updateItem,
        deleteItem,
        reorderItems,
        getDonationsByItem,
        getItemTotal,
        getGrandTotal,
        getGrandTarget,
        getActiveItem,
        getParticipantTotal
      }}
    >
      {children}
    </EventContext.Provider>
  );
}
export function useEvent() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}