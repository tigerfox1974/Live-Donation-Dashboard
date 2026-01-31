export type ParticipantType = 'ORG' | 'PERSON';
export type ParticipantStatus = 'active' | 'inactive';
export type ItemStatus = 'active' | 'inactive';
export type EventStatus = 'draft' | 'live' | 'closed' | 'archived';
export type EventTemplate = 'empty' | 'template' | 'import';

export interface Participant {
  id: string;
  token?: string;
  eventId?: string;
  type: ParticipantType;
  display_name: string;
  table_no: string;
  seat_label?: string;
  notes?: string;
  status: ParticipantStatus;
  qr_generated: boolean;
}

export interface DonationItem {
  id: string;
  eventId?: string;
  name: string;
  initial_target: number;
  image_url: string;
  order: number;
  status: ItemStatus;
  notes?: string;
}

export interface EventRecord {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  description?: string;
  status: EventStatus;
  participantCount: number;
  itemCount: number;
  totalTarget: number;
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
  lastUpdated: number;
  createdAt: number;
}

export interface CreateEventInput {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  description?: string;
  template: EventTemplate;
}

export type DonationStatus = 'pending' | 'approved' | 'rejected';

export interface Donation {
  id: string;
  participant_id: string;
  item_id: string;
  quantity: number;
  status: DonationStatus;
  timestamp: number;
}

export interface EventData {
  eventId: string;
  participants: Participant[];
  items: DonationItem[];
  donations: Donation[];
}

export interface AppState {
  items: DonationItem[];
  participants: Participant[];
  donations: Donation[];
  activeItemId: string | null;
  isFinalScreen: boolean;
}

export interface EventContextType extends AppState {
  isHydrating: boolean;
  // Actions
  addDonation: (participantId: string, quantity: number) => boolean;
  approveDonation: (donationId: string) => void;
  rejectDonation: (donationId: string) => void;
  undoLastApproval: () => void;
  setActiveItem: (itemId: string) => void;
  setFinalScreen: (show: boolean) => void;
  addParticipant: (participant: Omit<Participant, 'id'>) => void;
  updateParticipant: (id: string, data: Partial<Participant>) => void;
  deleteParticipant: (id: string) => void;
  addItem: (item: Omit<DonationItem, 'id'>) => void;
  updateItem: (id: string, data: Partial<DonationItem>) => void;
  deleteItem: (id: string) => void;
  reorderItems: (itemId: string, direction: 'up' | 'down') => void;

  // Computed helpers
  getDonationsByItem: (itemId: string) => Donation[];
  getItemTotal: (itemId: string) => number;
  getGrandTotal: () => number;
  getGrandTarget: () => number;
  getActiveItem: () => DonationItem | undefined;
  getParticipantTotal: (participantId: string) => number;
}