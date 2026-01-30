# DIAGNOSTIC REPORT (Workspace-wide)

> Not: Bu rapor sadece analizdir, UI/visual değişiklik yoktur.

## 1) Project Map

### 1.1 Routing + Protected Routes + Auth Persistence

**Hash routing ve korumalı route listesi (ProtectedRoute + localStorage auth):**

Kaynak: [src/App.tsx](src/App.tsx#L20-L87)
```tsx
const AUTH_STORAGE_KEY = 'polvak_auth';
const REDIRECT_STORAGE_KEY = 'redirectAfterLogin';
const PROTECTED_ROUTE_PREFIXES = [
  '#/panel-select',
  '#/projection-select',
  '#/operator',
  '#/display',
  '#/final',
  '#/events',
  '#/event-console'
];
...
function ProtectedRoute({ isAuthenticated, onLogin, children }: ProtectedRouteProps) {
  useEffect(() => {
    if (!isAuthenticated) {
      const currentHash = window.location.hash || '#/';
      const safeTarget = getSafeRedirectHash(currentHash);
      if (safeTarget) {
        setRedirectAfterLogin(safeTarget);
      }
      if (currentHash !== '#/') {
        window.location.hash = '#/';
      }
    }
  }, [isAuthenticated]);
  if (!isAuthenticated) {
    return <QRLandingPage onOperatorLogin={onLogin} />;
  }
  return <>{children}</>;
}
```

**Route tanımları (HashRouter yerine manuel hash routing):**

Kaynak: [src/App.tsx](src/App.tsx#L170-L200)
```tsx
// Router
// #/ -> QR Landing Page (public)
// #/panel-select -> Panel Selector (after login)
// #/projection-select -> Projection Event Selector
// #/display -> DisplayScreen (Projection)
// #/p/:token -> DonorScreen (QR direct access - production route)
// #/donor/:id -> DonorScreen (legacy/demo route)
// #/operator -> OperatorPanel (requires login)
// #/final -> FinalScreen
// #/events -> EventsConsole (hidden, URL-only access)
// #/demo -> Demo/Admin Landing (hidden, for testing)
```

**Route branch’leri (örnek: donor, display, events, operator):**

Kaynak: [src/App.tsx](src/App.tsx#L220-L303)
```tsx
if (hash.startsWith('#/display')) {
  return (
    <ProtectedRoute isAuthenticated={isLoggedIn} onLogin={handleLogin}>
      {isFinalScreen ?
      <FinalScreen activeEvent={activeEvent} /> :

      <DisplayScreen activeEvent={activeEvent} />}
    </ProtectedRoute>);
}
...
if (hash.startsWith('#/p/')) {
  const token = hash.split('/')[2];
  if (token) {
    return <DonorScreen participantId={token} activeEvent={activeEvent} />;
  }
}
...
if (hash.startsWith('#/events') || hash.startsWith('#/event-console')) {
  return (
    <ProtectedRoute isAuthenticated={isLoggedIn} onLogin={handleLogin}>
      <EventsConsole ... />
    </ProtectedRoute>);
}
```

**Landing sayfasında auth varsa otomatik redirect:**

Kaynak: [src/pages/QRLandingPage.tsx](src/pages/QRLandingPage.tsx#L12-L35)
```tsx
export function QRLandingPage({
  onOperatorLogin,
  isAuthenticated = false,
  onAlreadyAuthenticated
}: QRLandingPageProps) {
  ...
  useEffect(() => {
    if (isAuthenticated && onAlreadyAuthenticated) {
      onAlreadyAuthenticated();
    }
  }, [isAuthenticated, onAlreadyAuthenticated]);
```

### 1.2 Key Screens

- **Event Console**: `EventsConsole` bileşeni

Kaynak: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L270-L320)
```tsx
// ============ MAIN COMPONENT ============
export function EventsConsole({
  onSwitchToOperator,
  onSwitchToProjection,
  onSwitchToFinal,
  activeEventId
}: EventsConsoleProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  ...
}
```

- **Operator Panel**: `OperatorPanel` bileşeni

Kaynak: [src/pages/OperatorPanel.tsx](src/pages/OperatorPanel.tsx#L132-L176)
```tsx
export function OperatorPanel({
  onLogout,
  activeEvent,
  onSetActiveEvent,
  broadcastingEventId,
  onSetBroadcasting,
  onOpenEventDetail,
  onGoToEvents
}: OperatorPanelProps) {
  const [activeTab, setActiveTab] = useState<...>('live');
  const {
    items,
    activeItemId,
    setActiveItem,
    donations,
    participants,
    approveDonation,
    rejectDonation,
    ...
  } = useEvent();
```

- **Display Screen**: `DisplayScreen` bileşeni

Kaynak: [src/pages/DisplayScreen.tsx](src/pages/DisplayScreen.tsx#L64-L95)
```tsx
export function DisplayScreen({ activeEvent }: DisplayScreenProps) {
  const {
    getActiveItem,
    getItemTotal,
    getGrandTotal,
    getGrandTarget,
    donations,
    participants,
    activeItemId,
    items,
    ...
  } = useEvent();
```

- **Donor Screen**: `DonorScreen` bileşeni (QR token ile)

Kaynak: [src/pages/DonorScreen.tsx](src/pages/DonorScreen.tsx#L14-L46)
```tsx
export function DonorScreen({ participantId, activeEvent }: DonorScreenProps) {
  const {
    getActiveItem,
    addDonation,
    participants,
    activeItemId,
    canAcceptDonations,
    isTransitioning
  } = useEvent();
```

- **Panel Select**: `PanelSelector` bileşeni

Kaynak: [src/pages/PanelSelector.tsx](src/pages/PanelSelector.tsx#L8-L24)
```tsx
export function PanelSelector({
  onSelectOperator,
  onSelectProjection,
  onLogout
}: PanelSelectorProps) {
  return (
    <div className="min-h-screen ...">
```

## 2) State & Data Sources (Truth Table)

Aşağıdaki her varlık için **tek gerçek kaynak** (single source of truth) olup olmadığı ve **persist** durumu gösterilir.

### 2.1 Events

- **Depolama**: `EventsConsole` içinde **sabit MOCK_EVENTS** listesi

Kaynak: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L66-L120)
```tsx
// ============ MOCK DATA ============
const MOCK_EVENTS: EventRecord[] = [
  { id: 'evt-1', name: '2024 Yılsonu Bağış Gecesi', ... },
  { id: 'evt-2', name: '2024 Bahar Dayanışma Gecesi', ... },
  { id: 'evt-3', name: '2025 Yeni Yıl Etkinliği', ... }
];
```

- **Render edilen liste**: `MOCK_EVENTS` üzerinden filtreleniyor, state yok

Kaynak: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L312-L352)
```tsx
const stats = useMemo(() => {
  const total = MOCK_EVENTS.length;
  const live = MOCK_EVENTS.filter((e) => e.status === 'live').length;
  ...
}, []);
// Filtered & sorted events
const filteredEvents = useMemo(() => {
  let result = [...MOCK_EVENTS];
  ...
  return result;
}, [searchQuery, statusFilter, sortBy, sortDir]);
```

- **Persist**: Yok (in-file sabit data; state veya localStorage kullanılmıyor)

Kanıt: Events listesi sadece `MOCK_EVENTS` üzerinden üretiliyor, `useState` ile yönetilen bir events listesi yok. Bkz. [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L66-L352)

### 2.2 Participants

- **Operator/Donor akışında**: `EventContext` içindeki state

Kaynak: [src/contexts/EventContext.tsx](src/contexts/EventContext.tsx#L14-L35)
```tsx
export function EventProvider({ children }: {children: ReactNode;}) {
  const [items, setItems] = useState<DonationItem[]>(MOCK_ITEMS);
  const [participants, setParticipants] =
  useState<Participant[]>(MOCK_PARTICIPANTS);
  const [donations, setDonations] = useState<Donation[]>(MOCK_DONATIONS);
```

- **Event Console içinde**: ayrı `MOCK_PARTICIPANTS` listesi

Kaynak: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L1670-L1705)
```tsx
<tbody className="divide-y">
  {MOCK_PARTICIPANTS.map((p) =>
  <tr key={p.id} className="hover:bg-gray-50">
    ...
    {p.display_name}
```

- **Persist**: Yok (context useState; localStorage yok)

Kanıt: `setParticipants` ile sadece in-memory güncelleme yapılıyor. [src/contexts/EventContext.tsx](src/contexts/EventContext.tsx#L150-L190)
```tsx
const addParticipant = (participant: Omit<Participant, 'id'>) => {
  const newParticipant = { ...participant, id: `p-${Date.now()}` };
  setParticipants((prev) => [...prev, newParticipant]);
};
const updateParticipant = (id: string, data: Partial<Participant>) => {
  setParticipants((prev) =>
  prev.map((p) => (p.id === id ? { ...p, ...data } : p))
  );
};
```

### 2.3 Items/Needs

- **Operator/Display akışında**: `EventContext` içindeki state

Kaynak: [src/contexts/EventContext.tsx](src/contexts/EventContext.tsx#L120-L150)
```tsx
const addItem = (item: Omit<DonationItem, 'id'>) => {
  const newItem = { ...item, id: `item-${Date.now()}` };
  setItems((prev) => [...prev, newItem]);
};
const updateItem = (id: string, data: Partial<DonationItem>) => {
  setItems((prev) =>
  prev.map((item) => (item.id === id ? { ...item, ...data } : item))
  );
};
```

- **Event Console içinde**: ayrı state `useState(MOCK_ITEMS)`

Kaynak: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L1798-L1812)
```tsx
function ItemsTab() {
  ...
  const [items, setItems] = useState(MOCK_ITEMS);
  ...
}
```

- **Persist**: Yok (in-memory state)

Kanıt: `useState(MOCK_ITEMS)` kullanımı. [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L1798-L1812)

### 2.4 Donations/Approvals

- **Depolama**: `EventContext` içinde `donations` state

Kaynak: [src/contexts/EventContext.tsx](src/contexts/EventContext.tsx#L18-L33)
```tsx
const [donations, setDonations] = useState<Donation[]>(MOCK_DONATIONS);
```

- **Create (pending)**: Donor ekranından `addDonation`

Kaynak: [src/pages/DonorScreen.tsx](src/pages/DonorScreen.tsx#L33-L62)
```tsx
const handleSubmit = async () => {
  if (!participant || !activeItem) return;
  ...
  setTimeout(() => {
    const success = addDonation(participant.id, quantity);
    if (success) {
      setStatus('success');
    }
  }, 800);
};
```

- **Approve/Reject**: Operatör panelinden `approveDonation` / `rejectDonation`

Kaynak: [src/pages/OperatorPanel.tsx](src/pages/OperatorPanel.tsx#L672-L698)
```tsx
<Button
  size="sm"
  variant="success"
  onClick={() => approveDonation(donation.id)}>
  Onayla
</Button>
<Button
  size="sm"
  variant="danger"
  onClick={() => rejectDonation(donation.id)}>
  Reddet
</Button>
```

- **Persist**: Yok (in-memory state)

Kanıt: `addDonation`, `approveDonation` state güncellemesi. [src/contexts/EventContext.tsx](src/contexts/EventContext.tsx#L35-L77)

### 2.5 Logs

- **Depolama**: `EventsConsole` içinde `MOCK_AUDIT_LOG` sabit liste

Kaynak: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L164-L198)
```tsx
const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  { id: 'log-1', eventId: 'evt-1', action: 'Bağış onaylandı', ... },
  { id: 'log-2', eventId: 'evt-1', action: 'Kalem sırası değişti', ... }
];
```

- **Persist**: Yok (sabit data)

Kanıt: `MOCK_AUDIT_LOG` sadece sabit array. [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L164-L198)

## 3) Event Lifecycle (E2E Flow)

Aşağıdaki akışlar **mevcut kodun gerçek davranışı**dır.

### 3.1 Create Event (B1)

**UI giriş noktası (Yeni Etkinlik butonu):**

Kaynak: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L470-L490)
```tsx
<Button
  variant="secondary"
  onClick={() => setShowNewEventModal(true)}>
  <Plus className="w-4 h-4 mr-2" /> Yeni Etkinlik
</Button>
```

**Modal final action (Taslak Oluştur):**

Kaynak: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L2448-L2488)
```tsx
<Button
  variant="primary"
  onClick={step === 3 ? onClose : () => setStep(step + 1)}
  disabled={step === 1 && !formData.name}>
  {step === 3 ? 'Taslak Oluştur' : 'İleri'}
</Button>
```

**Liste/State güncellemesi yok:** Event listesi `MOCK_EVENTS` ile render edilir.

Kaynak: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L312-L352)
```tsx
const filteredEvents = useMemo(() => {
  let result = [...MOCK_EVENTS];
  ...
  return result;
}, [searchQuery, statusFilter, sortBy, sortDir]);
```

### 3.2 Activate / Go Live

**Status change sadece modal açıyor; onConfirm logic yok:**

Kaynak: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L806-L815)
```tsx
<ConfirmStatusChangeModal
  type={statusChangeType}
  onClose={() => setShowConfirmStatusModal(false)}
  onConfirm={() => {
    // Handle status change
    setShowConfirmStatusModal(false);
  }} />
```

### 3.3 Add Participants

**Operator Panel formu context’e yazar:**

Kaynak: [src/pages/OperatorPanel.tsx](src/pages/OperatorPanel.tsx#L832-L844)
```tsx
const handleSubmit = () => {
  if (!formData.display_name) return;
  if (editingId) {
    updateParticipant(editingId, formData);
  } else {
    addParticipant(formData as Omit<Participant, 'id'>);
  }
  resetForm();
};
```

**Context tarafında in-memory güncelleme:**

Kaynak: [src/contexts/EventContext.tsx](src/contexts/EventContext.tsx#L150-L172)
```tsx
const addParticipant = (participant: Omit<Participant, 'id'>) => {
  const newParticipant = { ...participant, id: `p-${Date.now()}` };
  setParticipants((prev) => [...prev, newParticipant]);
};
```

### 3.4 Add Needs/Items

**Operator Panel formu context’e yazar:**

Kaynak: [src/pages/OperatorPanel.tsx](src/pages/OperatorPanel.tsx#L1256-L1274)
```tsx
const handleSubmit = () => {
  if (!formData.name) return;
  if (editingId) {
    updateItem(editingId, formData);
  } else {
    addItem({
      ...formData,
      order: items.length + 1
    } as Omit<DonationItem, 'id'>);
  }
  resetForm();
};
```

**Context tarafında in-memory güncelleme:**

Kaynak: [src/contexts/EventContext.tsx](src/contexts/EventContext.tsx#L120-L132)
```tsx
const addItem = (item: Omit<DonationItem, 'id'>) => {
  const newItem = { ...item, id: `item-${Date.now()}` };
  setItems((prev) => [...prev, newItem]);
};
```

### 3.5 Generate QR / Token

**QR üretimi sadece flag set ediyor (token üretimi yok):**

Kaynak: [src/pages/OperatorPanel.tsx](src/pages/OperatorPanel.tsx#L854-L860)
```tsx
const handleGenerateQR = (id: string) => {
  updateParticipant(id, {
    qr_generated: true
  });
};
```

### 3.6 Submit Donation (pending)

**DonorScreen `addDonation` çağırıyor (pending):**

Kaynak: [src/pages/DonorScreen.tsx](src/pages/DonorScreen.tsx#L43-L62)
```tsx
setTimeout(() => {
  const success = addDonation(participant.id, quantity);
  if (success) {
    setStatus('success');
  } else {
    setStatus('blocked');
  }
}, 800);
```

**Context tarafında pending ekleniyor:**

Kaynak: [src/contexts/EventContext.tsx](src/contexts/EventContext.tsx#L35-L52)
```tsx
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
```

### 3.7 Approve Donation

**OperatorPanel `approveDonation` / `rejectDonation`:**

Kaynak: [src/pages/OperatorPanel.tsx](src/pages/OperatorPanel.tsx#L672-L698)
```tsx
<Button
  size="sm"
  variant="success"
  onClick={() => approveDonation(donation.id)}>
  Onayla
</Button>
<Button
  size="sm"
  variant="danger"
  onClick={() => rejectDonation(donation.id)}>
  Reddet
</Button>
```

**Context tarafında status güncelleniyor:**

Kaynak: [src/contexts/EventContext.tsx](src/contexts/EventContext.tsx#L53-L76)
```tsx
const approveDonation = (donationId: string) => {
  setDonations((prev) =>
  prev.map((d) =>
  d.id === donationId ? { ...d, status: 'approved' } : d
  )
  );
};
```

### 3.8 Projection Update

**DisplayScreen context verisini kullanıyor:**

Kaynak: [src/pages/DisplayScreen.tsx](src/pages/DisplayScreen.tsx#L68-L90)
```tsx
const {
  getActiveItem,
  getItemTotal,
  getGrandTotal,
  getGrandTarget,
  donations,
  participants,
  activeItemId,
  items,
  ...
} = useEvent();
```

### 3.9 Reports Export

**Export sadece simülasyon (no persistence/export logic):**

Kaynak: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L3136-L3156)
```tsx
const handleDownload = () => {
  // Simulate download
  setTimeout(() => {
    onClose();
  }, 1000);
};
```

## 4) Why B1 fails (Root Cause)

### 4.1 Create Event UI + Handler

**Create Event UI sadece modal açıyor:**

Kaynak: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L470-L490)
```tsx
<Button
  variant="secondary"
  onClick={() => setShowNewEventModal(true)}>
  <Plus className="w-4 h-4 mr-2" /> Yeni Etkinlik
</Button>
```

**Modal “Taslak Oluştur” action’ı sadece `onClose` çağırıyor (state update yok):**

Kaynak: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L2448-L2488)
```tsx
<Button
  variant="primary"
  onClick={step === 3 ? onClose : () => setStep(step + 1)}
  disabled={step === 1 && !formData.name}>
  {step === 3 ? 'Taslak Oluştur' : 'İleri'}
</Button>
```

### 4.2 Event List Source-of-Truth yok

**Event listesi `MOCK_EVENTS` sabit array’den geliyor:**

Kaynak: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L312-L352)
```tsx
const filteredEvents = useMemo(() => {
  let result = [...MOCK_EVENTS];
  ...
  return result;
}, [searchQuery, statusFilter, sortBy, sortDir]);
```

### 4.3 Diğer ekranlar da farklı mock event listeleri kullanıyor

**Projection selector mock event listesi kullanıyor:**

Kaynak: [src/pages/ProjectionEventSelector.tsx](src/pages/ProjectionEventSelector.tsx#L18-L50)
```tsx
// Mock events data (same as EventsConsole)
const MOCK_EVENTS = [
  { id: 'evt-1', name: '2024 Yılsonu Bağış Gecesi', ... },
  { id: 'evt-2', name: '2024 Bahar Dayanışma Gecesi', ... }
];
```

**Operator panel event selector ayrı mock listesi:**

Kaynak: [src/components/ActiveEventBar.tsx](src/components/ActiveEventBar.tsx#L186-L215)
```tsx
// Mock events for selector
const SELECTOR_EVENTS: (ActiveEventData & {
  participantCount: number;
  totalApproved: number;
})[] = [
  { id: 'evt-1', name: '2024 Yılsonu Bağış Gecesi', ... },
  { id: 'evt-2', name: '2024 Bahar Dayanışma Gecesi', ... }
];
```

### 4.4 Definitive Root Cause Conclusion

**Sonuç:** B1 “Create Event” akışı sadece UI modalını kapatıyor; **state update yok** ve event listesi **sabit `MOCK_EVENTS`** üzerinden render edildiği için yeni event **hiçbir yere yazılmıyor** ve **persist edilmiyor**. Ayrıca event seçiciler (Operator/Projection) ayrı mock listelerden okuduğu için “tek kaynak” hiç oluşmuyor.

Kanıtlar: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L2448-L2488), [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L312-L352), [src/pages/ProjectionEventSelector.tsx](src/pages/ProjectionEventSelector.tsx#L18-L50), [src/components/ActiveEventBar.tsx](src/components/ActiveEventBar.tsx#L186-L215)

## 5) Fix Plan (Minimal Changes)

Aşağıdaki plan **UI değiştirmeden** B1’i düzeltir. Her madde “nerede neyi değiştireceğini” net söyler.

1) **Events için tek kaynak ekle (Context veya App-level state)**
   - Mevcut durum: `EventsConsole` `MOCK_EVENTS` okuyor.
   - Değişecek dosya: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L312-L352)
   - Yapılacak: `MOCK_EVENTS` yerine `events` state/context kullan.

2) **Create Event handler ekle ve modal onConfirm’de çağır**
   - Mevcut durum: “Taslak Oluştur” sadece `onClose` çağırıyor.
   - Değişecek dosya: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L2448-L2488)
   - Yapılacak: `createEvent(formData)` gibi bir fonksiyon çağır ve `events` state’ini güncelle.

3) **ProjectionEventSelector ve EventSelectorModal’ı aynı event kaynağına bağla**
   - Mevcut durum: ayrı mock listeler var.
   - Değişecek dosyalar:
     - [src/pages/ProjectionEventSelector.tsx](src/pages/ProjectionEventSelector.tsx#L18-L50)
     - [src/components/ActiveEventBar.tsx](src/components/ActiveEventBar.tsx#L186-L215)
   - Yapılacak: `MOCK_EVENTS`/`SELECTOR_EVENTS` yerine paylaşılan `events` store kullan.

4) **Persist stratejisi belirle (minimum localStorage)**
   - Mevcut durum: event listesi herhangi bir storage’a yazılmıyor.
   - Değişecek dosya: Uygun ortak store (örn. context) + read/write.
   - Kanıt (mevcut in-memory state): [src/contexts/EventContext.tsx](src/contexts/EventContext.tsx#L14-L35)

## 6) Quick Verification Checklist (A1..F3)

Aşağıdaki testler, koddaki akışlara birebir dayalıdır.

- **A1: Auth login (PIN=1234)** → Panel Select görünür.
  - Kanıt: [src/pages/QRLandingPage.tsx](src/pages/QRLandingPage.tsx#L27-L52)

- **A2: Auth persistence (refresh sonrası)** → Protected route açılır.
  - Kanıt: [src/App.tsx](src/App.tsx#L20-L87)

- **B1: Create Event** → Yeni event listede görünür (fix sonrası).
  - Mevcut problem kanıtı: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L2448-L2488)

- **B2: Activate / Go Live** → Status değişimi listede görünür (fix sonrası).
  - Mevcut problem kanıtı: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L806-L815)

- **C1: Add Participants** → Katılımcı listesi güncellenir.
  - Kanıt: [src/pages/OperatorPanel.tsx](src/pages/OperatorPanel.tsx#L832-L844)

- **C2: Add Items** → Kalem listesi güncellenir.
  - Kanıt: [src/pages/OperatorPanel.tsx](src/pages/OperatorPanel.tsx#L1256-L1274)

- **D1: Generate QR** → `qr_generated` true olur.
  - Kanıt: [src/pages/OperatorPanel.tsx](src/pages/OperatorPanel.tsx#L854-L860)

- **E1: Submit Donation** → pending donation oluşur.
  - Kanıt: [src/pages/DonorScreen.tsx](src/pages/DonorScreen.tsx#L43-L62)

- **E2: Approve Donation** → donation status approved.
  - Kanıt: [src/contexts/EventContext.tsx](src/contexts/EventContext.tsx#L53-L76)

- **F1: Projection Update** → DisplayScreen totals değişir.
  - Kanıt: [src/pages/DisplayScreen.tsx](src/pages/DisplayScreen.tsx#L68-L90)

- **F2: Reports Export** → export modal simülasyonu çalışır.
  - Kanıt: [src/pages/EventsConsole.tsx](src/pages/EventsConsole.tsx#L3136-L3156)

- **F3: Event Selector Sync** → Operator/Projection selector yeni event’i görür (fix sonrası).
  - Mevcut problem kanıtı: [src/components/ActiveEventBar.tsx](src/components/ActiveEventBar.tsx#L186-L215)
