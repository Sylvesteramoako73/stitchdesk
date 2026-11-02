// Standard measurement fields used by tailors and seamstresses in Ghana.
// Values are stored by key so labels can change without touching data.

export type MeasurementField = { key: string; label: string; hint?: string }
export type FieldGroup = { title: string; fields: MeasurementField[] }

export const FEMALE_FIELDS: FieldGroup[] = [
  {
    title: 'Top',
    fields: [
      { key: 'bust',            label: 'Bust' },
      { key: 'underBust',       label: 'Under bust' },
      { key: 'waist',           label: 'Waist' },
      { key: 'shoulder',        label: 'Shoulder' },
      { key: 'neck',            label: 'Neck' },
      { key: 'bustPoint',       label: 'Bust point', hint: 'Nipple to nipple' },
      { key: 'shoulderToBust',  label: 'Shoulder to bust point' },
      { key: 'shoulderToUnder', label: 'Shoulder to under bust' },
      { key: 'shoulderToWaist', label: 'Shoulder to waist' },
      { key: 'blouseLength',    label: 'Blouse length' },
    ],
  },
  {
    title: 'Sleeves',
    fields: [
      { key: 'sleeveLength', label: 'Sleeve length' },
      { key: 'roundSleeve',  label: 'Round sleeve', hint: 'Around the arm' },
      { key: 'armhole',      label: 'Armhole' },
      { key: 'wrist',        label: 'Wrist' },
    ],
  },
  {
    title: 'Bottom',
    fields: [
      { key: 'hips',           label: 'Hips' },
      { key: 'thigh',          label: 'Thigh' },
      { key: 'knee',           label: 'Knee' },
      { key: 'skirtLength',    label: 'Skirt or slit length' },
      { key: 'dressLength',    label: 'Dress length' },
      { key: 'waistToKnee',    label: 'Waist to knee' },
      { key: 'trouserLength',  label: 'Trouser length' },
      { key: 'ankle',          label: 'Ankle' },
    ],
  },
]

export const MALE_FIELDS: FieldGroup[] = [
  {
    title: 'Top',
    fields: [
      { key: 'neck',        label: 'Neck' },
      { key: 'chest',       label: 'Chest' },
      { key: 'stomach',     label: 'Stomach' },
      { key: 'shoulder',    label: 'Shoulder' },
      { key: 'topLength',   label: 'Shirt or top length' },
      { key: 'gownLength',  label: 'Agbada or kaftan length' },
    ],
  },
  {
    title: 'Sleeves',
    fields: [
      { key: 'sleeveLength', label: 'Long sleeve length' },
      { key: 'shortSleeve',  label: 'Short sleeve length' },
      { key: 'roundSleeve',  label: 'Round sleeve', hint: 'Around the arm' },
      { key: 'wrist',        label: 'Wrist or cuff' },
    ],
  },
  {
    title: 'Trousers',
    fields: [
      { key: 'waist',         label: 'Waist' },
      { key: 'hips',          label: 'Hips or seat' },
      { key: 'thigh',         label: 'Thigh' },
      { key: 'knee',          label: 'Knee' },
      { key: 'trouserLength', label: 'Trouser length' },
      { key: 'inseam',        label: 'Inseam' },
      { key: 'bottom',        label: 'Bottom', hint: 'Trouser opening' },
    ],
  },
]

export function fieldsFor(gender: 'female' | 'male'): FieldGroup[] {
  return gender === 'male' ? MALE_FIELDS : FEMALE_FIELDS
}

export function fieldLabel(gender: 'female' | 'male', key: string): string {
  for (const g of fieldsFor(gender)) {
    const f = g.fields.find(f => f.key === key)
    if (f) return f.label
  }
  return key
}

/** Ordered list of [label, value] pairs for display or printing. */
export function measurementRows(m: {
  gender: 'female' | 'male'
  values: Record<string, number>
  custom?: { name: string; value: number }[]
}): [string, number][] {
  const rows: [string, number][] = []
  for (const g of fieldsFor(m.gender)) {
    for (const f of g.fields) {
      const v = m.values?.[f.key]
      if (typeof v === 'number' && !Number.isNaN(v)) rows.push([f.label, v])
    }
  }
  for (const c of m.custom ?? []) rows.push([c.name, c.value])
  return rows
}

export const GARMENT_TYPES = [
  'Kaba and slit', 'Dress', 'Gown', 'Wedding gown', 'Skirt and blouse', 'Jumpsuit', 'Two piece',
  'Shirt', 'Kaftan', 'Agbada', 'Fugu or smock', 'Suit', 'Trousers', 'Shorts', 'School uniform',
  'Church uniform', 'Corporate uniform', 'Alteration', 'Other',
]
