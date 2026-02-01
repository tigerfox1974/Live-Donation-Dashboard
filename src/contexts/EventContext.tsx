import React, {
  useEffect,
  useState,
  useRef,
  createContext,
  useContext,
  useMemo,
  ReactNode
} from 'react';
import { Donation, DonationItem, EventContextType, EventData, Participant } from '../types';
import { useDebouncedLocalStorage } from '../lib/debounce';
import { ItemsProvider, useItems } from './ItemsContext';
import { ParticipantsProvider, useParticipants, ensureParticipantTokens, registerExistingTokens } from './ParticipantsContext';
import { DonationsProvider, useDonations } from './DonationsContext';

// ============ Storage Keys ============
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

// ============ Storage Helpers ============
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

// ============ Extended Context Type ============
interface ExtendedEventContextType extends EventContextType {
  activeEventId: string | null;
  isTransitioning: boolean;
  setIsTransitioning: (value: boolean) => void;
  transitionCountdown: number;
  setTransitionCountdown: (value: number) => void;
  goToNextItem: () => void;
  goToPrevItem: () => void;
  canAcceptDonations: boolean;
}

const EventContext = createContext<ExtendedEventContextType | undefined>(undefined);

// ============ Provider Props ============
interface EventProviderProps {
  children: ReactNode;
  activeEventId: string | null;
  eventDataMap: Map<string, EventData>;
  onEventDataMapChange: React.Dispatch<React.SetStateAction<Map<string, EventData>>>;
  onEventDataChange?: (eventData: EventData) => void;
}

// ============ Internal State Provider ============
function EventStateProvider({
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
  const prevEventIdRef = useRef<string | null>(null);
  const itemsRef = useRef<DonationItem[]>([]);
  const participantsRef = useRef<Participant[]>([]);
  const donationsRef = useRef<Donation[]>([]);

  // Keep refs updated
  useEffect(() => { eventDataMapRef.current = eventDataMap; }, [eventDataMap]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { participantsRef.current = participants; }, [participants]);
  useEffect(() => { donationsRef.current = donations; }, [donations]);

  // ============ Debounced LocalStorage Writes ============
  useDebouncedLocalStorage(
    activeEventId ? getEventItemsKey(activeEventId) : '',
    items,
    500,
    !!activeEventId && items.length > 0
  );
  
  useDebouncedLocalStorage(
    activeEventId ? getEventParticipantsKey(activeEventId) : '',
    participants,
    500,
    !!activeEventId && participants.length > 0
  );
  
  useDebouncedLocalStorage(
    activeEventId ? getEventDonationsKey(activeEventId) : '',
    donations,
    500,
    !!activeEventId
  );

  // Save activeItemId immediately (small data)
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

  // Save previous event data before switching
  useEffect(() => {
    const prevEventId = prevEventIdRef.current;
    
    if (prevEventId && prevEventId !== activeEventId) {
      const prevItems = itemsRef.current;
      const prevParticipants = participantsRef.current;
      const prevDonations = donationsRef.current;
      
      if (prevItems.length > 0 || prevParticipants.length > 0 || prevDonations.length > 0) {
        try {
          localStorage.setItem(getEventItemsKey(prevEventId), JSON.stringify(prevItems));
          localStorage.setItem(getEventParticipantsKey(prevEventId), JSON.stringify(prevParticipants));
          localStorage.setItem(getEventDonationsKey(prevEventId), JSON.stringify(prevDonations));
        } catch {
          // no-op
        }
      }
      
      onEventDataMapChange((prev) => {
        const next = new Map(prev);
        next.set(prevEventId, {
          eventId: prevEventId,
          items: prevItems,
          participants: prevParticipants,
          donations: prevDonations
        });
        return next;
      });
    }
    
    prevEventIdRef.current = activeEventId;
  }, [activeEventId, onEventDataMapChange]);

  // Hydrate data when event changes
  useEffect(() => {
    if (!activeEventId) {
      setItems([]);
      setParticipants([]);
      setDonations([]);
      setActiveItemId(null);
      setIsFinalScreen(false);
      setIsTransitioning(false);
      setTransitionCountdown(0);
      return;
    }

    const fromMap = eventDataMapRef.current.get(activeEventId);
    const storedItems = readStorageArray<DonationItem>(getEventItemsKey(activeEventId));
    const storedParticipants = readStorageArray<Participant>(getEventParticipantsKey(activeEventId));
    const storedDonations = readStorageArray<Donation>(getEventDonationsKey(activeEventId));

    const baseItems = storedItems?.length ? storedItems : fromMap?.items || [];
    const baseParticipants = storedParticipants?.length ? storedParticipants : fromMap?.participants || [];
    const baseDonations = storedDonations?.length ? storedDonations : fromMap?.donations || [];

    setItems(baseItems);
    
    const hydratedParticipants = ensureParticipantTokens(baseParticipants, activeEventId);
    registerExistingTokens(hydratedParticipants);
    setParticipants(hydratedParticipants);
    setDonations(baseDonations);

    const storedActiveItemId = readStorageValue(getEventActiveItemKey(activeEventId));
    const nextActiveItemId = storedActiveItemId && baseItems.some((item) => item.id === storedActiveItemId)
      ? storedActiveItemId
      : baseItems[0]?.id || null;

    setActiveItemId(nextActiveItemId);
    setIsFinalScreen(false);
    setIsTransitioning(false);
    setTransitionCountdown(0);
    setIsHydrating(false);
  }, [activeEventId]);

  // Cross-tab sync
  useEffect(() => {
    if (!activeEventId) return;
    
    const handleStorage = (event: StorageEvent) => {
      if (!event.key) return;
      const itemsKey = getEventItemsKey(activeEventId);
      const participantsKey = getEventParticipantsKey(activeEventId);
      const donationsKey = getEventDonationsKey(activeEventId);
      const activeItemKey = getEventActiveItemKey(activeEventId);
      
      if (event.key === itemsKey) {
        setItems(readStorageArray<DonationItem>(itemsKey) || []);
      }
      if (event.key === participantsKey) {
        const nextParticipants = readStorageArray<Participant>(participantsKey) || [];
        setParticipants(ensureParticipantTokens(nextParticipants, activeEventId));
      }
      if (event.key === donationsKey) {
        setDonations(readStorageArray<Donation>(donationsKey) || []);
      }
      if (event.key === activeItemKey) {
        setActiveItemId(readStorageValue(activeItemKey) || null);
      }
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [activeEventId]);

  // Update eventDataMap
  useEffect(() => {
    if (!activeEventId) return;
    const payload: EventData = { eventId: activeEventId, items, participants, donations };
    onEventDataMapChange((prev) => {
      const next = new Map(prev);
      next.set(activeEventId, payload);
      return next;
    });
    if (onEventDataChange) {
      onEventDataChange(payload);
    }
  }, [activeEventId, items, participants, donations, onEventDataMapChange, onEventDataChange]);

  // Auto-select first item if current is invalid
  useEffect(() => {
    if (!items.length) {
      if (activeItemId !== null) setActiveItemId(null);
      return;
    }
    if (activeItemId && items.some((item) => item.id === activeItemId)) return;
    setActiveItemId(items[0].id);
  }, [items, activeItemId]);

  return (
    <ItemsProvider
      items={items}
      setItems={setItems}
      activeItemId={activeItemId}
      setActiveItemId={setActiveItemId}
      isFinalScreen={isFinalScreen}
      setIsFinalScreen={setIsFinalScreen}
      isTransitioning={isTransitioning}
      setIsTransitioning={setIsTransitioning}
      transitionCountdown={transitionCountdown}
      setTransitionCountdown={setTransitionCountdown}
      activeEventId={activeEventId}
    >
      <ParticipantsProvider
        participants={participants}
        setParticipants={setParticipants}
        activeEventId={activeEventId}
      >
        <DonationsProvider
          donations={donations}
          setDonations={setDonations}
          items={items}
          participants={participants}
          activeItemId={activeItemId}
          activeEventId={activeEventId}
          canAcceptDonations={canAcceptDonations}
        >
          <CombinedEventProvider activeEventId={activeEventId} isHydrating={isHydrating}>
            {children}
          </CombinedEventProvider>
        </DonationsProvider>
      </ParticipantsProvider>
    </ItemsProvider>
  );
}

// ============ Combined Provider (for backward compatibility) ============
function CombinedEventProvider({
  children,
  activeEventId,
  isHydrating
}: {
  children: ReactNode;
  activeEventId: string | null;
  isHydrating: boolean;
}) {
  const itemsContext = useItems();
  const participantsContext = useParticipants();
  const donationsContext = useDonations();

  const value = useMemo<ExtendedEventContextType>(() => ({
    activeEventId,
    isHydrating,
    items: itemsContext.items,
    participants: participantsContext.participants,
    donations: donationsContext.donations,
    activeItemId: itemsContext.activeItemId,
    isFinalScreen: itemsContext.isFinalScreen,
    isTransitioning: itemsContext.isTransitioning,
    setIsTransitioning: itemsContext.setIsTransitioning,
    transitionCountdown: itemsContext.transitionCountdown,
    setTransitionCountdown: itemsContext.setTransitionCountdown,
    canAcceptDonations: donationsContext.canAcceptDonations,
    addDonation: donationsContext.addDonation,
    approveDonation: donationsContext.approveDonation,
    rejectDonation: donationsContext.rejectDonation,
    undoLastApproval: donationsContext.undoLastApproval,
    setActiveItem: itemsContext.setActiveItem,
    setFinalScreen: itemsContext.setFinalScreen,
    goToNextItem: itemsContext.goToNextItem,
    goToPrevItem: itemsContext.goToPrevItem,
    addParticipant: participantsContext.addParticipant,
    updateParticipant: participantsContext.updateParticipant,
    deleteParticipant: participantsContext.deleteParticipant,
    addItem: itemsContext.addItem,
    updateItem: itemsContext.updateItem,
    deleteItem: itemsContext.deleteItem,
    reorderItems: itemsContext.reorderItems,
    getDonationsByItem: donationsContext.getDonationsByItem,
    getItemTotal: donationsContext.getItemTotal,
    getGrandTotal: donationsContext.getGrandTotal,
    getGrandTarget: donationsContext.getGrandTarget,
    getActiveItem: itemsContext.getActiveItem,
    getParticipantTotal: donationsContext.getParticipantTotal
  }), [
    activeEventId,
    isHydrating,
    itemsContext,
    participantsContext,
    donationsContext
  ]);

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
}

// ============ Main Export ============
export function EventProvider(props: EventProviderProps) {
  return <EventStateProvider {...props} />;
}

export function useEvent() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}

// Re-export individual context hooks for granular subscriptions
export { useItems, useItemsData, useActiveItem, useItemNavigation, useItemActions } from './ItemsContext';
export { useParticipants, useParticipantsData, useParticipantActions, useParticipantLookup } from './ParticipantsContext';
export { useDonations, useDonationsData, useDonationActions, useDonationStats } from './DonationsContext';
