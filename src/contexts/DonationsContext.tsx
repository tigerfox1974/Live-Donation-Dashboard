import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode
} from 'react';
import { Donation, DonationItem, Participant } from '../types';
import { appendAuditLog, AuditActions } from '../lib/auditLog';

// ============ Types ============
interface DonationsContextType {
  donations: Donation[];
  canAcceptDonations: boolean;
  
  // Actions
  addDonation: (participantId: string, quantity: number) => boolean;
  approveDonation: (donationId: string) => void;
  rejectDonation: (donationId: string) => void;
  undoLastApproval: () => void;
  
  // Computed
  getDonationsByItem: (itemId: string) => Donation[];
  getItemTotal: (itemId: string) => number;
  getGrandTotal: () => number;
  getGrandTarget: () => number;
  getParticipantTotal: (participantId: string) => number;
  pendingDonations: Donation[];
  approvedDonations: Donation[];
}

interface DonationsProviderProps {
  children: ReactNode;
  donations: Donation[];
  setDonations: React.Dispatch<React.SetStateAction<Donation[]>>;
  items: DonationItem[];
  participants: Participant[];
  activeItemId: string | null;
  activeEventId: string | null;
  canAcceptDonations: boolean;
}

// ============ Context ============
const DonationsContext = createContext<DonationsContextType | undefined>(undefined);

// ============ Provider ============
export function DonationsProvider({
  children,
  donations,
  setDonations,
  items,
  participants,
  activeItemId,
  activeEventId,
  canAcceptDonations
}: DonationsProviderProps) {
  
  // Memoized filtered donations
  const pendingDonations = useMemo(() => {
    return donations.filter(d => d.status === 'pending');
  }, [donations]);
  
  const approvedDonations = useMemo(() => {
    return donations.filter(d => d.status === 'approved');
  }, [donations]);
  
  const addDonation = useCallback((participantId: string, quantity: number) => {
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
  }, [activeItemId, canAcceptDonations, setDonations]);
  
  const approveDonation = useCallback((donationId: string) => {
    setDonations((prev) => {
      const donation = prev.find(d => d.id === donationId);
      
      if (donation && activeEventId) {
        const participant = participants.find(p => p.id === donation.participant_id);
        const item = items.find(i => i.id === donation.item_id);
        appendAuditLog({
          eventId: activeEventId,
          action: AuditActions.DONATION_APPROVED,
          details: `${participant?.display_name || 'Bilinmeyen'} - ${item?.name || 'Bilinmeyen'} x${donation.quantity}`
        });
      }
      
      return prev.map((d) =>
        d.id === donationId ? { ...d, status: 'approved' as const } : d
      );
    });
  }, [setDonations, activeEventId, participants, items]);
  
  const rejectDonation = useCallback((donationId: string) => {
    setDonations((prev) => {
      const donation = prev.find(d => d.id === donationId);
      
      if (donation && activeEventId) {
        const participant = participants.find(p => p.id === donation.participant_id);
        const item = items.find(i => i.id === donation.item_id);
        appendAuditLog({
          eventId: activeEventId,
          action: AuditActions.DONATION_REJECTED,
          details: `${participant?.display_name || 'Bilinmeyen'} - ${item?.name || 'Bilinmeyen'} x${donation.quantity}`
        });
      }
      
      return prev.map((d) =>
        d.id === donationId ? { ...d, status: 'rejected' as const } : d
      );
    });
  }, [setDonations, activeEventId, participants, items]);
  
  const undoLastApproval = useCallback(() => {
    setDonations((prev) => {
      const sortedApproved = [...prev]
        .filter((d) => d.status === 'approved')
        .sort((a, b) => b.timestamp - a.timestamp);
      
      if (sortedApproved.length > 0) {
        const lastDonation = sortedApproved[0];
        
        if (activeEventId) {
          const participant = participants.find(p => p.id === lastDonation.participant_id);
          const item = items.find(i => i.id === lastDonation.item_id);
          appendAuditLog({
            eventId: activeEventId,
            action: AuditActions.DONATION_UNDONE,
            details: `${participant?.display_name || 'Bilinmeyen'} - ${item?.name || 'Bilinmeyen'} x${lastDonation.quantity}`
          });
        }
        
        return prev.filter((d) => d.id !== lastDonation.id);
      }
      return prev;
    });
  }, [setDonations, activeEventId, participants, items]);
  
  const getDonationsByItem = useCallback((itemId: string) => {
    return donations.filter(
      (d) => d.item_id === itemId && d.status === 'approved'
    );
  }, [donations]);
  
  const getItemTotal = useCallback((itemId: string) => {
    return getDonationsByItem(itemId).reduce((sum, d) => sum + d.quantity, 0);
  }, [getDonationsByItem]);
  
  const getGrandTotal = useCallback(() => {
    return approvedDonations.reduce((sum, d) => sum + d.quantity, 0);
  }, [approvedDonations]);
  
  const getGrandTarget = useCallback(() => {
    return items.reduce((sum, item) => sum + item.initial_target, 0);
  }, [items]);
  
  const getParticipantTotal = useCallback((participantId: string) => {
    return donations
      .filter(
        (d) => d.participant_id === participantId && d.status === 'approved'
      )
      .reduce((sum, d) => sum + d.quantity, 0);
  }, [donations]);
  
  const value = useMemo<DonationsContextType>(() => ({
    donations,
    canAcceptDonations,
    addDonation,
    approveDonation,
    rejectDonation,
    undoLastApproval,
    getDonationsByItem,
    getItemTotal,
    getGrandTotal,
    getGrandTarget,
    getParticipantTotal,
    pendingDonations,
    approvedDonations
  }), [
    donations,
    canAcceptDonations,
    addDonation,
    approveDonation,
    rejectDonation,
    undoLastApproval,
    getDonationsByItem,
    getItemTotal,
    getGrandTotal,
    getGrandTarget,
    getParticipantTotal,
    pendingDonations,
    approvedDonations
  ]);
  
  return (
    <DonationsContext.Provider value={value}>
      {children}
    </DonationsContext.Provider>
  );
}

// ============ Hooks ============
export function useDonations() {
  const context = useContext(DonationsContext);
  if (context === undefined) {
    throw new Error('useDonations must be used within a DonationsProvider');
  }
  return context;
}

// Selector hooks for preventing unnecessary re-renders
export function useDonationsData() {
  const { donations, pendingDonations, approvedDonations } = useDonations();
  return useMemo(() => ({
    donations,
    pendingDonations,
    approvedDonations
  }), [donations, pendingDonations, approvedDonations]);
}

export function useDonationActions() {
  const { addDonation, approveDonation, rejectDonation, undoLastApproval, canAcceptDonations } = useDonations();
  return useMemo(() => ({
    addDonation,
    approveDonation,
    rejectDonation,
    undoLastApproval,
    canAcceptDonations
  }), [addDonation, approveDonation, rejectDonation, undoLastApproval, canAcceptDonations]);
}

export function useDonationStats() {
  const { getItemTotal, getGrandTotal, getGrandTarget, getParticipantTotal, getDonationsByItem } = useDonations();
  return useMemo(() => ({
    getItemTotal,
    getGrandTotal,
    getGrandTarget,
    getParticipantTotal,
    getDonationsByItem
  }), [getItemTotal, getGrandTotal, getGrandTarget, getParticipantTotal, getDonationsByItem]);
}
