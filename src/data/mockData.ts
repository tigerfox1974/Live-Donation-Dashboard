import { DonationItem, Participant, Donation } from '../types';

export const MOCK_ITEMS: DonationItem[] = [
{
  id: 'item-1',
  name: 'Polis Motosikleti',
  initial_target: 10,
  image_url:
  'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800',
  order: 1,
  status: 'active',
  notes: 'Trafik denetimi için'
},
{
  id: 'item-2',
  name: 'Devriye Aracı',
  initial_target: 5,
  image_url:
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800',
  order: 2,
  status: 'active',
  notes: ''
},
{
  id: 'item-3',
  name: 'Çelik Yelek Seti',
  initial_target: 50,
  image_url:
  'https://images.unsplash.com/photo-1595759622382-747a835d3268?auto=format&fit=crop&q=80&w=800',
  order: 3,
  status: 'active',
  notes: 'Koruyucu ekipman'
},
{
  id: 'item-4',
  name: 'Telsiz Ekipmanı',
  initial_target: 100,
  image_url:
  'https://images.unsplash.com/photo-1588611910679-6bc2357303c7?auto=format&fit=crop&q=80&w=800',
  order: 4,
  status: 'active',
  notes: ''
},
{
  id: 'item-5',
  name: 'Drone Gözetleme Sistemi',
  initial_target: 3,
  image_url:
  'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&q=80&w=800',
  order: 5,
  status: 'active',
  notes: 'Hava gözetleme'
}];


export const MOCK_PARTICIPANTS: Participant[] = [
{
  id: 'p-1',
  type: 'ORG',
  display_name: 'Kıbrıs Türk Ticaret Odası',
  table_no: 'A1',
  status: 'active',
  qr_generated: true
},
{
  id: 'p-2',
  type: 'ORG',
  display_name: 'Limasol Bankası',
  table_no: 'A2',
  status: 'active',
  qr_generated: true
},
{
  id: 'p-3',
  type: 'PERSON',
  display_name: 'Ahmet Yılmaz',
  table_no: 'B1',
  seat_label: '1',
  status: 'active',
  qr_generated: true
},
{
  id: 'p-4',
  type: 'PERSON',
  display_name: 'Mehmet Demir',
  table_no: 'B1',
  seat_label: '2',
  status: 'active',
  qr_generated: false
},
{
  id: 'p-5',
  type: 'ORG',
  display_name: 'Creditwest Bank',
  table_no: 'A3',
  status: 'active',
  qr_generated: true
},
{
  id: 'p-6',
  type: 'PERSON',
  display_name: 'Ayşe Kaya',
  table_no: 'B2',
  status: 'active',
  qr_generated: false
},
{
  id: 'p-7',
  type: 'ORG',
  display_name: 'Kıbrıs Vakıflar İdaresi',
  table_no: 'A4',
  status: 'active',
  qr_generated: true
},
{
  id: 'p-8',
  type: 'PERSON',
  display_name: 'Mustafa Çelik',
  table_no: 'C1',
  status: 'inactive',
  qr_generated: false,
  notes: 'İptal edildi'
},
{
  id: 'p-9',
  type: 'ORG',
  display_name: 'Kıbrıs Türk Sanayi Odası',
  table_no: 'A5',
  status: 'active',
  qr_generated: true
},
{
  id: 'p-10',
  type: 'PERSON',
  display_name: 'Fatma Öztürk',
  table_no: 'C2',
  status: 'active',
  qr_generated: false
}];


const now = Date.now();
export const MOCK_DONATIONS: Donation[] = [
{
  id: 'd-1',
  participant_id: 'p-1',
  item_id: 'item-1',
  quantity: 2,
  status: 'approved',
  timestamp: now - 1000000
},
{
  id: 'd-2',
  participant_id: 'p-2',
  item_id: 'item-1',
  quantity: 3,
  status: 'approved',
  timestamp: now - 900000
},
{
  id: 'd-3',
  participant_id: 'p-3',
  item_id: 'item-1',
  quantity: 1,
  status: 'approved',
  timestamp: now - 800000
},
{
  id: 'd-4',
  participant_id: 'p-5',
  item_id: 'item-2',
  quantity: 1,
  status: 'pending',
  timestamp: now - 5000
},
{
  id: 'd-5',
  participant_id: 'p-7',
  item_id: 'item-3',
  quantity: 10,
  status: 'approved',
  timestamp: now - 700000
},
{
  id: 'd-6',
  participant_id: 'p-9',
  item_id: 'item-4',
  quantity: 25,
  status: 'approved',
  timestamp: now - 600000
},
{
  id: 'd-7',
  participant_id: 'p-1',
  item_id: 'item-3',
  quantity: 5,
  status: 'approved',
  timestamp: now - 500000
},
{
  id: 'd-8',
  participant_id: 'p-2',
  item_id: 'item-4',
  quantity: 15,
  status: 'approved',
  timestamp: now - 400000
}];