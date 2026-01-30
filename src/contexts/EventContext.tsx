import React, { useCallback, useState, createContext, useContext } from 'react';
import { Donation, DonationItem, EventContextType, Participant } from '../types';
import { MOCK_ITEMS, MOCK_PARTICIPANTS, MOCK_DONATIONS } from '../data/mockData';
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
export function EventProvider({ children }: {children: ReactNode;}) {
  const [items, setItems] = useState<DonationItem[]>(MOCK_ITEMS);
  const [participants, setParticipants] =
  useState<Participant[]>(MOCK_PARTICIPANTS);
  const [donations, setDonations] = useState<Donation[]>(MOCK_DONATIONS);
  const [activeItemId, setActiveItemId] = useState<string | null>(
    MOCK_ITEMS[0].id
  );
  const [isFinalScreen, setIsFinalScreen] = useState(false);
  // Transition state for projection
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionCountdown, setTransitionCountdown] = useState(0);
  // Check if donations can be accepted (not during transition)
  const canAcceptDonations = !isTransitioning;
  // Donation Actions
  const addDonation = (participantId: string, quantity: number) => {
    if (!activeItemId) return false;
    if (!canAcceptDonations) return false; // Block donations during transition
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
    d.id === donationId ?
    {
      ...d,
      status: 'approved'
    } :
    d
    )
    );
  };
  const rejectDonation = (donationId: string) => {
    setDonations((prev) =>
    prev.map((d) =>
    d.id === donationId ?
    {
      ...d,
      status: 'rejected'
    } :
    d
    )
    );
  };
  const undoLastApproval = () => {
    const sortedApproved = [...donations].
    filter((d) => d.status === 'approved').
    sort((a, b) => b.timestamp - a.timestamp);
    if (sortedApproved.length > 0) {
      const lastId = sortedApproved[0].id;
      setDonations((prev) =>
      prev.map((d) =>
      d.id === lastId ?
      {
        ...d,
        status: 'pending'
      } :
      d
      )
      );
    }
  };
  // Item Actions
  const setActiveItem = (itemId: string) => {
    setActiveItemId(itemId);
    setIsFinalScreen(false);
    setIsTransitioning(false);
    setTransitionCountdown(0);
  };
  const setFinalScreen = (show: boolean) => {
    setIsFinalScreen(show);
  };
  // Navigation helpers for projection
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
      id: `item-${Date.now()}`
    };
    setItems((prev) => [...prev, newItem]);
  };
  const updateItem = (id: string, data: Partial<DonationItem>) => {
    setItems((prev) =>
    prev.map((item) =>
    item.id === id ?
    {
      ...item,
      ...data
    } :
    item
    )
    );
  };
  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (activeItemId === id) {
      const remaining = items.filter((item) => item.id !== id);
      setActiveItemId(remaining.length > 0 ? remaining[0].id : null);
    }
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
  // Participant Actions
  const addParticipant = (participant: Omit<Participant, 'id'>) => {
    const newParticipant = {
      ...participant,
      id: `p-${Date.now()}`
    };
    setParticipants((prev) => [...prev, newParticipant]);
  };
  const updateParticipant = (id: string, data: Partial<Participant>) => {
    setParticipants((prev) =>
    prev.map((p) =>
    p.id === id ?
    {
      ...p,
      ...data
    } :
    p
    )
    );
  };
  const deleteParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };
  // Helpers
  const getDonationsByItem = (itemId: string) => {
    return donations.filter(
      (d) => d.item_id === itemId && d.status === 'approved'
    );
  };
  const getItemTotal = (itemId: string) => {
    return getDonationsByItem(itemId).reduce((sum, d) => sum + d.quantity, 0);
  };
  const getGrandTotal = () => {
    return donations.
    filter((d) => d.status === 'approved').
    reduce((sum, d) => sum + d.quantity, 0);
  };
  const getGrandTarget = () => {
    return items.reduce((sum, item) => sum + item.initial_target, 0);
  };
  const getActiveItem = () => {
    return items.find((i) => i.id === activeItemId);
  };
  const getParticipantTotal = (participantId: string) => {
    return donations.
    filter(
      (d) => d.participant_id === participantId && d.status === 'approved'
    ).
    reduce((sum, d) => sum + d.quantity, 0);
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
      }}>

      {children}
    </EventContext.Provider>);

}
export function useEvent() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}