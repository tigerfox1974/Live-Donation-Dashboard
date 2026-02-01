import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode
} from 'react';
import { Participant } from '../types';
import { appendAuditLog, AuditActions } from '../lib/auditLog';

// ============ Token Generation ============
const usedTokens = new Set<string>();

const generateToken = (existingTokens?: Set<string>): string => {
  const allUsed = existingTokens ? new Set([...usedTokens, ...existingTokens]) : usedTokens;
  
  let random: string;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(6);
    crypto.getRandomValues(array);
    random = Array.from(array).map(b => b.toString(36).padStart(2, '0')).join('').slice(0, 8).toUpperCase();
  } else {
    random = Math.random().toString(36).slice(2, 10).toUpperCase();
  }
  
  const timestamp = Date.now().toString(36).toUpperCase();
  let token = `T${timestamp.slice(-4)}-${random}`;
  
  let attempts = 0;
  while (allUsed.has(token) && attempts < 100) {
    const extra = Math.random().toString(36).slice(2, 5).toUpperCase();
    token = `T${timestamp.slice(-4)}-${random}-${extra}`;
    attempts++;
  }
  
  usedTokens.add(token);
  return token;
};

export const ensureParticipantTokens = (list: Participant[], eventId: string): Participant[] => {
  const existingTokens = new Set<string>();
  list.forEach(p => {
    if (p.token) existingTokens.add(p.token);
  });
  
  return list.map((p) => {
    if (p.token) {
      return { ...p, eventId: p.eventId || eventId };
    }
    
    const newToken = generateToken(existingTokens);
    existingTokens.add(newToken);
    
    return { ...p, token: newToken, eventId: p.eventId || eventId };
  });
};

export const registerExistingTokens = (participants: Participant[]) => {
  participants.forEach(p => {
    if (p.token) usedTokens.add(p.token);
  });
};

// ============ Types ============
interface ParticipantsContextType {
  participants: Participant[];
  
  // Actions
  addParticipant: (participant: Omit<Participant, 'id'>) => void;
  updateParticipant: (id: string, data: Partial<Participant>) => void;
  deleteParticipant: (id: string) => void;
  
  // Computed
  getParticipantById: (id: string) => Participant | undefined;
  getParticipantByToken: (token: string) => Participant | undefined;
  activeParticipants: Participant[];
}

interface ParticipantsProviderProps {
  children: ReactNode;
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  activeEventId: string | null;
}

// ============ Context ============
const ParticipantsContext = createContext<ParticipantsContextType | undefined>(undefined);

// ============ Provider ============
export function ParticipantsProvider({
  children,
  participants,
  setParticipants,
  activeEventId
}: ParticipantsProviderProps) {
  
  // Memoized active participants
  const activeParticipants = useMemo(() => {
    return participants.filter(p => p.status === 'active');
  }, [participants]);
  
  const addParticipant = useCallback((participant: Omit<Participant, 'id'>) => {
    const newParticipant: Participant = {
      ...participant,
      id: `p-${Date.now()}`,
      token: participant.token || generateToken(),
      eventId: participant.eventId || activeEventId || undefined
    };
    setParticipants((prev) => [...prev, newParticipant]);
    
    if (activeEventId) {
      appendAuditLog({
        eventId: activeEventId,
        action: AuditActions.PARTICIPANT_ADDED,
        details: newParticipant.display_name
      });
    }
  }, [setParticipants, activeEventId]);
  
  const updateParticipant = useCallback((id: string, data: Partial<Participant>) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...data,
              token: data.token ?? p.token ?? generateToken(),
              eventId: data.eventId ?? p.eventId ?? activeEventId ?? undefined
            }
          : p
      )
    );
  }, [setParticipants, activeEventId]);
  
  const deleteParticipant = useCallback((id: string) => {
    setParticipants((prev) => {
      const participant = prev.find(p => p.id === id);
      
      if (activeEventId && participant) {
        appendAuditLog({
          eventId: activeEventId,
          action: AuditActions.PARTICIPANT_DELETED,
          details: participant.display_name
        });
      }
      
      return prev.filter((p) => p.id !== id);
    });
  }, [setParticipants, activeEventId]);
  
  const getParticipantById = useCallback((id: string) => {
    return participants.find((p) => p.id === id);
  }, [participants]);
  
  const getParticipantByToken = useCallback((token: string) => {
    return participants.find((p) => p.token === token);
  }, [participants]);
  
  const value = useMemo<ParticipantsContextType>(() => ({
    participants,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    getParticipantById,
    getParticipantByToken,
    activeParticipants
  }), [
    participants,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    getParticipantById,
    getParticipantByToken,
    activeParticipants
  ]);
  
  return (
    <ParticipantsContext.Provider value={value}>
      {children}
    </ParticipantsContext.Provider>
  );
}

// ============ Hooks ============
export function useParticipants() {
  const context = useContext(ParticipantsContext);
  if (context === undefined) {
    throw new Error('useParticipants must be used within a ParticipantsProvider');
  }
  return context;
}

// Selector hooks for preventing unnecessary re-renders
export function useParticipantsData() {
  const { participants, activeParticipants } = useParticipants();
  return useMemo(() => ({ participants, activeParticipants }), [participants, activeParticipants]);
}

export function useParticipantActions() {
  const { addParticipant, updateParticipant, deleteParticipant } = useParticipants();
  return useMemo(() => ({
    addParticipant,
    updateParticipant,
    deleteParticipant
  }), [addParticipant, updateParticipant, deleteParticipant]);
}

export function useParticipantLookup() {
  const { getParticipantById, getParticipantByToken } = useParticipants();
  return useMemo(() => ({
    getParticipantById,
    getParticipantByToken
  }), [getParticipantById, getParticipantByToken]);
}
