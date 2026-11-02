// Shared domain types for StitchDesk

export type DayHours = { open: string; close: string; closed: boolean }
export type WorkingHours = {
  monday: DayHours; tuesday: DayHours; wednesday: DayHours;
  thursday: DayHours; friday: DayHours; saturday: DayHours; sunday: DayHours;
}

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  monday:    { open: '08:00', close: '18:00', closed: false },
  tuesday:   { open: '08:00', close: '18:00', closed: false },
  wednesday: { open: '08:00', close: '18:00', closed: false },
  thursday:  { open: '08:00', close: '18:00', closed: false },
  friday:    { open: '08:00', close: '18:00', closed: false },
  saturday:  { open: '08:00', close: '16:00', closed: false },
  sunday:    { open: '08:00', close: '16:00', closed: true  },
}

export type MomoNetwork = 'mtn' | 'vodafone' | 'airteltigo'

export type SalonSettings = {
  salonName:               string
  tagline:                 string
  phone:                   string
  whatsappNumber:          string
  address:                 string
  email:                   string
  depositPct:              number
  workingHours:            WorkingHours
  galleryImages?:          string[]
  autoMessages?:           'off' | 'sms' | 'whatsapp'
  measurementUnit?:        'in' | 'cm'
  payoutMomoNumber?:       string
  payoutNetwork?:          MomoNetwork
  paystackRecipientCode?:  string
}

export type TenantPlan = 'trial' | 'starter' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled'

export type Tenant = {
  id: string
  name: string           // salon display name
  slug: string           // subdomain slug e.g. "hairport"
  ownerId: string        // Firebase Auth UID of the owner
  plan: TenantPlan
  trialEndsAt: string    // ISO date
  subscriptionStatus: SubscriptionStatus
  paystackCustomerCode: string | null
  paystackSubscriptionCode: string | null
  paidUntil?: string | null   // ISO; set when a monthly payment is verified
  createdAt: string
  updatedAt: string
}

export type Client = {
  id: string
  name: string
  phone: string
  gender?: 'female' | 'male' | null
  email: string | null
  dateOfBirth: string | null
  address: string | null
  loyaltyPoints: number
  loyaltyTier: string
  notes: string | null
  tags: string
  isActive: boolean
  lastVisitAt: string | null
  totalVisits: number
  totalSpent: number
  preferredStaff: string | null
  createdAt: string
  updatedAt: string
}

export type Staff = {
  id: string
  name: string
  role: string
  phone: string | null
  email: string | null
  specialties: string
  rating: number
  commissionRate: number
  isActive: boolean
  isAvailable: boolean
  color: string
  locationId: string | null
  locationName: string | null
  createdAt: string
  updatedAt: string
}

export type StaffWithStats = Staff & {
  todayBookings: number
  completedToday: number
  monthlyEarnings: number
}

export type ProgressNote = {
  id: string
  date: string
  note: string
  rating: number
  addedBy: string
}

export type SkillSignOff = {
  skill: string
  status: 'not_started' | 'in_progress' | 'signed_off'
  signedOffBy: string | null
  signedOffAt: string | null
}

export type ApprenticeTask = {
  id: string
  apprenticeId: string
  title: string
  description: string | null
  dueDate: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
  assignedBy: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type AttendanceRecord = {
  id: string
  apprenticeId: string
  date: string
  status: 'present' | 'absent' | 'late'
  notes: string | null
  recordedBy: string
  createdAt: string
}

export type Apprentice = {
  id: string
  name: string
  phone: string | null
  email: string | null
  mentorId: string | null
  mentorName: string | null
  locationId: string | null
  locationName: string | null
  stage: 'beginner' | 'intermediate' | 'advanced'
  status: 'active' | 'graduated' | 'dropped'
  startDate: string
  expectedGraduationDate: string | null
  programDurationMonths: number | null
  specialtiesLearning: string
  skillSignOffs: SkillSignOff[]
  stipend: number | null
  notes: string | null
  progressNotes: ProgressNote[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}


// ─── Fashion: measurements, orders, catalogue ─────────────────────────────────

export type MeasurementUnit = 'in' | 'cm'

export type Measurement = {
  id: string
  clientId: string
  label: string                       // e.g. "Standard", "Kaba and slit", "Wedding 2026"
  gender: 'female' | 'male'
  unit: MeasurementUnit
  values: Record<string, number>      // field key → value
  custom: { name: string; value: number }[]
  notes: string | null
  takenBy: string | null
  takenAt: string                     // YYYY-MM-DD
  createdAt: string
  updatedAt: string
}

export type OrderStatus =
  | 'received' | 'cutting' | 'sewing' | 'fitting' | 'finishing' | 'ready' | 'collected' | 'cancelled'

export type PaymentMethod = 'cash' | 'momo' | 'bank_transfer' | 'card'

export type OrderPayment = {
  id: string
  amount: number
  method: PaymentMethod
  note: string | null
  paidAt: string          // ISO
  recordedBy: string
}

export type OrderStatusEvent = { status: OrderStatus; at: string; by: string }

export type Order = {
  id: string
  orderNumber: string               // e.g. "SD-0042"
  trackingToken: string             // public, unguessable
  clientId: string
  clientName: string
  clientPhone: string
  title: string                     // e.g. "Kente wedding gown"
  garmentType: string               // e.g. "Kaba and slit"
  quantity: number
  styleNotes: string | null
  styleImages: string[]
  fabricSource: 'client' | 'shop'
  fabricNotes: string | null
  price: number                     // total agreed price incl. fabric if supplied
  discount: number
  payments: OrderPayment[]
  amountPaid: number
  balance: number
  status: OrderStatus
  statusHistory: OrderStatusEvent[]
  isRush: boolean
  dueDate: string                   // YYYY-MM-DD
  fittingDate: string | null        // YYYY-MM-DD
  assignedTo: string | null         // staff id
  assignedName: string | null
  measurementId: string | null
  measurement: Pick<Measurement, 'label' | 'gender' | 'unit' | 'values' | 'custom' | 'notes'> | null
  locationId: string | null
  collectedAt: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type CatalogueItem = {
  id: string
  name: string
  category: string
  description: string | null
  priceFrom: number
  typicalDays: number
  imageUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}
