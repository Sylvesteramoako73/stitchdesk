export interface Faq { q: string; a: string }

export const FAQS: Faq[] = [
  { q: 'Who is StitchDesk for?', a: 'Fashion designers, tailors and seamstresses, from one person sewing at home to a fashion house with several branches. If you take measurements, collect deposits and promise clients a ready date, StitchDesk is built for you.' },
  { q: 'Do I need a card to start?', a: 'No. The 14 day trial is free and needs no card. You only pay when you decide to subscribe, by Mobile Money or card through Paystack.' },
  { q: 'How much does StitchDesk cost?', a: 'Starter is GHS 99 a month, Pro is GHS 199 a month, and Fashion House is GHS 399 a month for businesses with more than one branch. Prices are in cedis and every plan starts with a 14 day free trial.' },
  { q: 'Can I save measurements for both men and women?', a: 'Yes. There are separate measurement sheets for female and male clients covering tops, sleeves, skirts, dresses and trousers, plus extra fields you name yourself. You can measure in inches or centimetres and keep several sets per client, such as a standard set and a wedding set.' },
  { q: 'How do my clients follow their order?', a: 'Every order gets a private tracking link. Send it on WhatsApp in one tap and your client can see whether their outfit is being cut, sewn, ready for fitting or ready for pickup, along with their balance, without calling you.' },
  { q: 'Does it send WhatsApp messages for me?', a: 'Every order has ready made messages for confirmation, fitting reminders, ready for pickup and balance reminders that open in WhatsApp with one tap. On Pro and above you can also switch on automatic SMS or WhatsApp messages when an order is ready or a fitting is tomorrow.' },
  { q: 'Can my tailors and apprentices use it?', a: 'Yes. Add your team with their own logins. Staff see orders, clients and measurements, while owners keep control of settings and money. Each order can be assigned to the tailor sewing it, and you can print a job card with the measurements and style notes.' },
  { q: 'Does it work on my phone?', a: 'Yes. StitchDesk runs in the browser on any Android phone, iPhone, tablet or laptop, and you can add it to your home screen like an app.' },
  { q: 'Is my data safe?', a: 'Your data is stored on Google Cloud (Firebase), and every record is tied to your business so no other StitchDesk user can see it. We never sell or share your data.' },
]

export const faqPageLd = (items: Faq[]) => ({
  '@type': 'FAQPage',
  mainEntity: items.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
})
