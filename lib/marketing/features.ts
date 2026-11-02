import type { Faq } from './faqs'

export type FeatureIcon = 'ruler' | 'scissors' | 'wallet' | 'message' | 'users'

export interface FeaturePage {
  slug: string
  name: string
  icon: FeatureIcon
  title: string
  description: string
  h1: string
  intro: string
  image: { src: string; alt: string }
  benefitsHeading: string
  benefits: { title: string; text: string }[]
  stepsHeading: string
  steps: { title: string; text: string }[]
  planNote: string
  faqs: Faq[]
  related: string[]
  relatedPost?: string
}

export const FEATURE_PAGES: FeaturePage[] = [
  {
    slug: 'client-measurements',
    name: 'Measurement book',
    icon: 'ruler',
    title: 'Client Measurement App for Tailors and Designers | StitchDesk',
    description:
      'Save every client measurement once, for men and women, in inches or centimetres. Keep several sets per client and attach them to each order.',
    h1: 'A measurement book that never gets lost',
    intro:
      'Measurements written in a notebook get lost, smudged or left at the shop. StitchDesk keeps every client’s measurements in one place, with sheets for female and male clients, your own extra fields, and as many sets as you need. Attach a set to an order and it travels with the job to whoever is sewing it.',
    image: { src: '/images/app-measure.png', alt: 'StitchDesk measurement sheet for a client with bust, waist and hip measurements' },
    benefitsHeading: 'Measure once, sew many times',
    benefits: [
      { title: 'Female and male sheets', text: 'Bust, under bust, shoulder to waist, slit length, agbada length, inseam and more, grouped the way you take them.' },
      { title: 'Inches or centimetres', text: 'Pick a default for the shop, and change it for any client who prefers the other.' },
      { title: 'Several sets per client', text: 'Keep a standard set, a wedding set or an after pregnancy set, each dated, so you always sew from the right one.' },
      { title: 'Your own fields', text: 'Add any measurement your style needs, like back width or cap size, without waiting for us.' },
      { title: 'Copy and re measure', text: 'Start a new set from the last one and change only what moved. History stays intact.' },
      { title: 'Printed on the job card', text: 'Measurements print on the job card with the style notes, so the tailor never has to ask.' },
    ],
    stepsHeading: 'From tape to saved in under two minutes',
    steps: [
      { title: 'Add the client', text: 'Name and phone number are enough to start.' },
      { title: 'Take measurements', text: 'Fill in what you measured on your phone, right there at the table.' },
      { title: 'Attach to orders', text: 'Every new order picks up the latest set automatically.' },
    ],
    planNote: 'The measurement book is included on every plan, including Starter.',
    faqs: [
      { q: 'Can I keep old measurements when a client changes size?', a: 'Yes. Each set is dated and kept. Copy the last set, update what changed, and both stay on the client’s record.' },
      { q: 'What if I measure something that is not on the sheet?', a: 'Add your own measurement with any name. It is saved with the set and printed on the job card.' },
      { q: 'Can my staff see measurements?', a: 'Yes. Everyone on your team can view and take measurements, so whoever is at the shop can serve the client.' },
    ],
    related: ['order-tracking', 'job-cards-and-production', 'deposits-and-balances'],
  },
  {
    slug: 'order-tracking',
    name: 'Order tracking',
    icon: 'scissors',
    title: 'Order Tracking for Fashion Designers in Ghana | StitchDesk',
    description:
      'Track every order from received to cutting, sewing, fitting and pickup. Send clients a private tracking link so they stop calling to ask.',
    h1: 'Know where every outfit is, and let clients see it too',
    intro:
      'December, Easter and wedding season bring dozens of orders at once. StitchDesk shows every order on a list or a production board, flags anything overdue, and gives each client a private tracking link. Clients check their own progress, so your phone stops ringing with “is my dress ready?”',
    image: { src: '/images/app-orders.png', alt: 'StitchDesk orders list showing due dates, statuses and balances' },
    benefitsHeading: 'Deadlines you can see coming',
    benefits: [
      { title: 'Clear stages', text: 'Received, cutting, sewing, fitting, finishing, ready and collected. Move an order forward with one tap.' },
      { title: 'Overdue and due this week', text: 'The dashboard shows what is late and what is due in the next seven days, so nothing slips.' },
      { title: 'Rush jobs stand out', text: 'Mark a rush order and it jumps to the top of the list.' },
      { title: 'Tracking link for clients', text: 'Each order gets a private page showing its stage, ready date and balance. Share it on WhatsApp.' },
      { title: 'Fittings in view', text: 'Set a fitting date and see the next three days of fittings on your dashboard.' },
      { title: 'Search everything', text: 'Find any order by client name, phone number, order number or style.' },
    ],
    stepsHeading: 'Your first tracked order',
    steps: [
      { title: 'Create the order', text: 'Pick the client, the style, the ready date and the deposit.' },
      { title: 'Send the link', text: 'Tap Send on WhatsApp and the client gets a confirmation with their tracking link.' },
      { title: 'Move it along', text: 'As the work moves, tap the next stage. The client’s page updates straight away.' },
    ],
    planNote: 'Order tracking and client tracking links are included on every plan.',
    faqs: [
      { q: 'Can clients see other people’s orders?', a: 'No. Each tracking link is a long random code for one order only, and it shows just the client’s first name, the order and the balance.' },
      { q: 'Do clients need to download an app?', a: 'No. The tracking link opens in any phone browser.' },
      { q: 'Can I move an order back a stage?', a: 'Yes. Tap any stage to set it, for example back to sewing after a fitting.' },
    ],
    related: ['whatsapp-messages', 'client-measurements', 'job-cards-and-production'],
  },
  {
    slug: 'deposits-and-balances',
    name: 'Deposits and balances',
    icon: 'wallet',
    title: 'Track Deposits and Balances for Tailoring Orders | StitchDesk',
    description:
      'Record deposits and part payments by Mobile Money, cash, bank or card. See exactly who owes what, and print receipts in cedis.',
    h1: 'Every cedi accounted for',
    intro:
      'Part payments are where money quietly goes missing. StitchDesk records the deposit when the order is taken and every payment after it, shows the balance on the order, the client and the dashboard, and prints a receipt your client can keep.',
    image: { src: '/images/app-order.png', alt: 'StitchDesk order page with deposit, payments and balance' },
    benefitsHeading: 'No more guessing who has paid',
    benefits: [
      { title: 'Deposit at order', text: 'Record the deposit and how it was paid while you take the order.' },
      { title: 'Part payments', text: 'Add payments as they come in, by Mobile Money, cash, bank transfer or card.' },
      { title: 'Balance everywhere', text: 'The balance shows on the order, on the client and on the dashboard total.' },
      { title: 'Receipts in cedis', text: 'Download a clean receipt with every payment listed and the tracking link printed.' },
      { title: 'Balance reminders', text: 'Send a polite balance reminder on WhatsApp with one tap.' },
      { title: 'Owner controls', text: 'Only owners and managers can remove a payment, so records stay honest.' },
    ],
    stepsHeading: 'Money in, recorded in seconds',
    steps: [
      { title: 'Take the deposit', text: 'Enter the deposit and method on the new order.' },
      { title: 'Record each payment', text: 'Tap Full balance or type the amount when the client pays.' },
      { title: 'Print the receipt', text: 'Download and share the receipt on WhatsApp.' },
    ],
    planNote: 'Deposits, balances and receipts are included on every plan.',
    faqs: [
      { q: 'Can I give a discount?', a: 'Yes. Add a discount on the order and the balance updates.' },
      { q: 'Does StitchDesk collect the money for me?', a: 'No. Clients pay you the way they always have. StitchDesk keeps the record so you always know where you stand.' },
      { q: 'Can I see how much came in this month?', a: 'Yes. The dashboard shows payments received this month and the total still owed on open orders.' },
    ],
    related: ['order-tracking', 'whatsapp-messages', 'client-measurements'],
  },
  {
    slug: 'job-cards-and-production',
    name: 'Production board',
    icon: 'users',
    title: 'Production Board and Job Cards for Tailoring Workshops | StitchDesk',
    description:
      'Assign orders to tailors, see the whole workshop on a board, and print job cards with measurements and style notes.',
    h1: 'Run the workshop, not just the front desk',
    intro:
      'When several tailors and apprentices share the work, the hard part is knowing who has what. StitchDesk lets you assign each order, see the whole workshop on a production board, and print a job card that carries the measurements, style notes and dates to the sewing table.',
    image: { src: '/images/app-board.png', alt: 'StitchDesk production board with orders in cutting, sewing and fitting columns' },
    benefitsHeading: 'Everyone knows what to sew next',
    benefits: [
      { title: 'Production board', text: 'Columns for each stage. Move orders forward or back as the work moves.' },
      { title: 'Assign to a tailor', text: 'Each order shows who is sewing it, and you can filter the list by person.' },
      { title: 'Printable job cards', text: 'A4 card with measurements, style notes, fabric, dates and sign off boxes for cut, sewn and checked.' },
      { title: 'Staff accounts', text: 'Tailors log in to see orders and measurements without touching settings.' },
      { title: 'Apprentice tracking', text: 'Skills, tasks and attendance for every apprentice in your workshop.' },
      { title: 'Commission', text: 'See each tailor’s orders in hand and commission on orders collected this month.' },
    ],
    stepsHeading: 'Set up your team',
    steps: [
      { title: 'Add your tailors', text: 'Add each person and give them a login if they need one.' },
      { title: 'Assign orders', text: 'Choose who is sewing when you create or edit an order.' },
      { title: 'Print job cards', text: 'Print a card for each job and pin it to the fabric.' },
    ],
    planNote: 'The production board and job cards are on every plan. Unlimited team accounts and apprentice tracking are on Pro and above.',
    faqs: [
      { q: 'Can a tailor see only their own orders?', a: 'Staff can see every order, and filter the list to their own with one tap. Owners can see everything and control money and settings.' },
      { q: 'Do I need a printer for job cards?', a: 'No. The job card is a PDF you can print or simply open on a phone at the sewing table.' },
      { q: 'Can I track apprentices?', a: 'Yes. Record skills signed off, tasks, attendance and progress notes, and print a completion certificate.' },
    ],
    related: ['order-tracking', 'client-measurements', 'deposits-and-balances'],
  },
  {
    slug: 'whatsapp-messages',
    name: 'WhatsApp messages',
    icon: 'message',
    title: 'WhatsApp Order Updates for Fashion Designers | StitchDesk',
    description:
      'Send order confirmations, fitting reminders, ready for pickup and balance reminders on WhatsApp in one tap, or automatically by SMS or WhatsApp.',
    h1: 'The right message to the right client, in one tap',
    intro:
      'Your clients already live on WhatsApp. StitchDesk writes the message for you, with the client’s name, order, dates, balance and tracking link, and opens WhatsApp ready to send. On Pro you can let StitchDesk send ready and fitting messages on its own.',
    image: { src: '/images/app-track.png', alt: 'Client tracking page on a phone showing order progress and balance' },
    benefitsHeading: 'Messages clients actually read',
    benefits: [
      { title: 'Order confirmation', text: 'Sent when you take the order, with the ready date, balance and tracking link.' },
      { title: 'Fitting reminders', text: 'A reminder with the fitting date so clients turn up.' },
      { title: 'Ready for pickup', text: 'Tell clients the moment their outfit is ready, with the balance to bring.' },
      { title: 'Balance reminders', text: 'Polite and clear, with the order and amount.' },
      { title: 'Automatic messages', text: 'Switch on SMS or WhatsApp sending for ready orders and tomorrow’s fittings.' },
      { title: 'Ghana numbers handled', text: 'Local numbers like 024 are converted for WhatsApp automatically.' },
    ],
    stepsHeading: 'Messaging, set up once',
    steps: [
      { title: 'Add your WhatsApp number', text: 'Clients see it on their tracking page and can reply to you directly.' },
      { title: 'Use one tap messages', text: 'Open any order and pick the message you want to send.' },
      { title: 'Go automatic on Pro', text: 'Choose SMS or WhatsApp in settings and StitchDesk handles ready and fitting messages.' },
    ],
    planNote: 'One tap WhatsApp messages are on every plan. Automatic SMS and WhatsApp sending is on Pro and above.',
    faqs: [
      { q: 'Do messages come from my number?', a: 'One tap messages open your own WhatsApp, so they come from you. Automatic messages use the number you connect in settings.' },
      { q: 'Can I change the wording?', a: 'You can edit any one tap message in WhatsApp before you send it.' },
      { q: 'What does the client see on the tracking page?', a: 'Their first name, the order, its stage, the ready and fitting dates, the balance, and buttons to call or WhatsApp you.' },
    ],
    related: ['order-tracking', 'deposits-and-balances', 'client-measurements'],
  },
]

export const featureBySlug = (slug: string) => FEATURE_PAGES.find(f => f.slug === slug)
