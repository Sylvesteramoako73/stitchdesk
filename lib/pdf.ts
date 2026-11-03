import type { StaffWithStats, Apprentice, Order } from '@/lib/types'
import { measurementRows } from '@/lib/fashion/measurements'
import { STATUS_LABEL, PAYMENT_LABEL } from '@/lib/fashion/status'

const GHS = (n: number) => `GHS ${n.toFixed(2)}`

function addWeeks(dateStr: string, weeks: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + weeks * 7)
  return d.toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function downloadStaffReportPDF(
  member: StaffWithStats,
  period: { start: string; end: string },
  appointments: { date: string; clientName: string; services: string; totalPrice: number; status: string }[]
) {
  const { getSalonSettings } = await import('@/lib/actions/settings')
  const _sr = await getSalonSettings()
  const salonName = _sr.salonName || 'Your Salon'

  const { jsPDF } = await import('jspdf')
  const doc    = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW  = doc.internal.pageSize.getWidth()
  const margin = 20
  let y        = margin

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Staff Performance Report', margin, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`${salonName} · Generated ${new Date().toLocaleDateString('en-GH')}`, margin, y)
  doc.text(`Period: ${period.start} → ${period.end}`, pageW - margin, y, { align: 'right' })

  // Divider
  y += 6
  doc.setDrawColor(220)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // Staff details
  doc.setTextColor(40)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(member.name, margin, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80)
  doc.text(`${member.role}${member.phone ? ' · ' + member.phone : ''}`, margin, y)

  // Summary boxes
  y += 10
  const boxes = [
    { label: 'Appointments', value: String(appointments.length) },
    { label: 'Revenue Generated', value: GHS(member.monthlyEarnings / (member.commissionRate / 100) || 0) },
    { label: 'Commission Rate', value: `${member.commissionRate}%` },
    { label: 'Commission Earned', value: GHS(member.monthlyEarnings ?? 0) },
  ]
  const boxW = (pageW - margin * 2 - 9) / 4
  boxes.forEach((box, i) => {
    const x = margin + i * (boxW + 3)
    doc.setFillColor(248, 248, 248)
    doc.rect(x, y, boxW, 18, 'F')
    doc.setFontSize(7)
    doc.setTextColor(120)
    doc.text(box.label, x + 3, y + 5)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30)
    doc.text(box.value, x + 3, y + 13)
    doc.setFont('helvetica', 'normal')
  })

  // Appointments table
  y += 26
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, y - 4, pageW - margin * 2, 8, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(80)
  doc.text('Date', margin + 2, y)
  doc.text('Client', margin + 28, y)
  doc.text('Services', margin + 68, y)
  doc.text('Status', pageW - margin - 30, y)
  doc.text('Amount', pageW - margin, y, { align: 'right' })

  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  for (const apt of appointments) {
    if (y > 270) { doc.addPage(); y = margin }
    doc.setTextColor(apt.status === 'completed' ? 40 : 120)
    doc.text(apt.date, margin + 2, y)
    doc.text(apt.clientName.slice(0, 18), margin + 28, y)
    doc.text(apt.services.slice(0, 28), margin + 68, y)
    doc.text(apt.status, pageW - margin - 30, y)
    doc.text(GHS(apt.totalPrice), pageW - margin, y, { align: 'right' })
    y += 6
  }

  // Footer
  y += 8
  doc.setDrawColor(220)
  doc.line(margin, y, pageW - margin, y)
  y += 6
  doc.setFontSize(8)
  doc.setTextColor(140)
  doc.setFont('helvetica', 'italic')
  doc.text(salonName + ' — Confidential', pageW / 2, y, { align: 'center' })

  doc.save(`staff-report-${member.name.replace(/\s+/g, '-')}-${period.start}.pdf`)
}

export async function downloadApprenticeCertificate(apprentice: Apprentice) {
  const { getSalonSettings } = await import('@/lib/actions/settings')
  const _sc = await getSalonSettings()
  const salonName = _sc.salonName || 'Your Salon'

  const { jsPDF } = await import('jspdf')
  const doc    = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  const pageW  = doc.internal.pageSize.getWidth()
  const pageH  = doc.internal.pageSize.getHeight()
  const cx     = pageW / 2

  // Gold double border
  doc.setDrawColor(180, 140, 60)
  doc.setLineWidth(3)
  doc.rect(8, 8, pageW - 16, pageH - 16)
  doc.setLineWidth(0.6)
  doc.rect(13, 13, pageW - 26, pageH - 26)

  // Corner ornaments
  const corners = [[18, 18], [pageW - 18, 18], [18, pageH - 18], [pageW - 18, pageH - 18]] as const
  corners.forEach(([x, y]) => {
    doc.setFillColor(180, 140, 60)
    doc.circle(x, y, 2, 'F')
  })

  // Salon name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(140, 100, 30)
  doc.text('LUXE BEAUTY STUDIO', cx, 28, { align: 'center' })

  // Gold divider
  doc.setDrawColor(180, 140, 60)
  doc.setLineWidth(0.8)
  doc.line(50, 33, pageW - 50, 33)

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(30)
  doc.setTextColor(30, 30, 30)
  doc.text('Certificate of Completion', cx, 50, { align: 'center' })

  // Subtitle
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text('This is to certify that', cx, 64, { align: 'center' })

  // Apprentice name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(34)
  doc.setTextColor(20, 20, 20)
  doc.text(apprentice.name, cx, 82, { align: 'center' })

  // Underline name
  doc.setDrawColor(180, 140, 60)
  doc.setLineWidth(0.5)
  const nameWidth = doc.getTextWidth(apprentice.name)
  doc.line(cx - nameWidth / 2, 85, cx + nameWidth / 2, 85)

  // Program description
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(60, 60, 60)
  const stageCap = apprentice.stage.charAt(0).toUpperCase() + apprentice.stage.slice(1)
  doc.text(
    `has successfully completed the ${stageCap} Apprenticeship Program`,
    cx, 97, { align: 'center' }
  )

  // Duration line
  const gradDate = apprentice.expectedGraduationDate ?? new Date().toISOString().split('T')[0]
  const months = Math.round(
    (new Date(gradDate).getTime() - new Date(apprentice.startDate).getTime()) / (30.44 * 86400000)
  )
  const durationLabel = months >= 12
    ? `${Math.floor(months / 12)} year${Math.floor(months / 12) !== 1 ? 's' : ''}${months % 12 ? ` ${months % 12} months` : ''}`
    : `${months} month${months !== 1 ? 's' : ''}`

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`${apprentice.startDate}  →  ${gradDate}  (${durationLabel})`, cx, 107, { align: 'center' })

  // Skills
  const skills = apprentice.specialtiesLearning.split(',').map(s => s.trim()).filter(Boolean)
  if (skills.length > 0) {
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text('Skills Mastered:', cx, 120, { align: 'center' })
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(11)
    doc.setTextColor(40, 40, 40)
    doc.text(skills.join('  ·  '), cx, 129, { align: 'center' })
    doc.setFont('helvetica', 'normal')
  }

  // Gold divider
  doc.setDrawColor(180, 140, 60)
  doc.setLineWidth(0.4)
  doc.line(50, 140, pageW - 50, 140)

  // Signature lines
  const sigY   = pageH - 36
  const leftX  = pageW * 0.27
  const rightX = pageW * 0.73
  const sigLen = 45

  doc.setDrawColor(80, 80, 80)
  doc.setLineWidth(0.3)
  doc.line(leftX - sigLen / 2, sigY, leftX + sigLen / 2, sigY)
  doc.line(rightX - sigLen / 2, sigY, rightX + sigLen / 2, sigY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text(apprentice.mentorName ?? 'Mentor', leftX, sigY + 5, { align: 'center' })
  doc.text('Studio Director', rightX, sigY + 5, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text('Mentor / Trainer', leftX, sigY + 10, { align: 'center' })
  doc.text(salonName, rightX, sigY + 10, { align: 'center' })

  // Issue date
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(`Issued: ${new Date().toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })}`, cx, pageH - 18, { align: 'center' })

  doc.save(`certificate-${apprentice.name.replace(/\s+/g, '-')}.pdf`)
}


// ─── StitchDesk: order receipt and workshop job card ──────────────────────────

type ShopInfo = { name: string; phone?: string; address?: string }

// The title falls back to the garment type, so only add the type when it says something new
function styleLabel(order: Order) {
  return order.garmentType && order.garmentType !== order.title ? `${order.title} (${order.garmentType})` : order.title
}

function pdfDate(iso: string) {
  return new Date(iso.length === 10 ? iso + 'T12:00:00Z' : iso)
    .toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
}

function shopHeader(doc: any, shop: ShopInfo, title: string, margin: number, pageW: number) {
  let y = margin
  doc.setFillColor(30, 41, 89)
  doc.rect(0, 0, pageW, 4, 'F')
  y += 4
  doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.setTextColor(20, 24, 48)
  doc.text(shop.name || 'Your shop', margin, y)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(110, 116, 130)
  const contact = [shop.phone, shop.address].filter(Boolean).join('   ')
  if (contact) doc.text(contact, margin, y + 5)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(37, 99, 235)
  doc.text(title.toUpperCase(), pageW - margin, y, { align: 'right' })
  y += 11
  doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.4)
  doc.line(margin, y, pageW - margin, y)
  return y + 7
}

function keyValue(doc: any, label: string, value: string, x: number, y: number) {
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(120, 126, 140)
  doc.text(label.toUpperCase(), x, y)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(25, 28, 40)
  doc.text(value || '', x, y + 5)
}

export async function downloadOrderReceipt(order: Order, shop: ShopInfo, trackingLink?: string) {
  const { jsPDF } = await import('jspdf')
  const doc    = new jsPDF({ unit: 'mm', format: 'a5' })
  const pageW  = doc.internal.pageSize.getWidth()
  const margin = 14
  let y = shopHeader(doc, shop, 'Receipt', margin, pageW)

  keyValue(doc, 'Order', order.orderNumber, margin, y)
  keyValue(doc, 'Date', pdfDate(order.createdAt), margin + 42, y)
  keyValue(doc, 'Ready by', pdfDate(order.dueDate), margin + 84, y)
  y += 14
  keyValue(doc, 'Client', order.clientName, margin, y)
  keyValue(doc, 'Phone', order.clientPhone, margin + 84, y)
  y += 16

  // Item line
  doc.setFillColor(241, 245, 249)
  doc.rect(margin, y - 5, pageW - margin * 2, 8, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(80, 86, 100)
  doc.text('ITEM', margin + 2, y); doc.text('QTY', pageW - margin - 40, y); doc.text('AMOUNT', pageW - margin - 2, y, { align: 'right' })
  y += 9
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(25, 28, 40)
  const itemLines = doc.splitTextToSize(styleLabel(order), pageW - margin * 2 - 50)
  doc.text(itemLines, margin + 2, y)
  doc.text(String(order.quantity), pageW - margin - 40, y)
  doc.text(GHS(order.price), pageW - margin - 2, y, { align: 'right' })
  y += itemLines.length * 5 + 1
  if (order.fabricSource === 'shop') {
    doc.setFontSize(8); doc.setTextColor(120, 126, 140)
    doc.text('Fabric supplied by the shop', margin + 2, y); y += 5
  }
  y += 3
  doc.setDrawColor(226, 232, 240); doc.line(margin, y, pageW - margin, y); y += 7

  const row = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(bold ? 11 : 9.5)
    doc.setTextColor(bold ? 20 : 80, bold ? 24 : 86, bold ? 48 : 100)
    doc.text(label, pageW - margin - 60, y)
    doc.text(value, pageW - margin - 2, y, { align: 'right' })
    y += bold ? 7 : 6
  }
  row('Subtotal', GHS(order.price))
  if (order.discount) row('Discount', '- ' + GHS(order.discount))
  row('Paid', GHS(order.amountPaid))
  row('Balance', GHS(order.balance), true)
  y += 3

  if ((order.payments ?? []).length) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(80, 86, 100)
    doc.text('PAYMENTS', margin, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60, 66, 80)
    for (const p of order.payments) {
      doc.text(`${pdfDate(p.paidAt)}   ${PAYMENT_LABEL[p.method] ?? p.method}${p.note ? '   ' + p.note : ''}`, margin, y)
      doc.text(GHS(p.amount), pageW - margin - 2, y, { align: 'right' })
      y += 5
    }
  }

  // Footer
  const footY = doc.internal.pageSize.getHeight() - 16
  doc.setDrawColor(226, 232, 240); doc.line(margin, footY - 4, pageW - margin, footY - 4)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120, 126, 140)
  if (trackingLink) doc.text(`Track your order: ${trackingLink}`, margin, footY)
  doc.text('Thank you for your patronage.', margin, footY + 5)

  doc.save(`${order.orderNumber}-receipt.pdf`)
}

export async function downloadJobCard(order: Order, shop: ShopInfo) {
  const { jsPDF } = await import('jspdf')
  const doc    = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW  = doc.internal.pageSize.getWidth()
  const margin = 16
  let y = shopHeader(doc, shop, 'Job card', margin, pageW)

  keyValue(doc, 'Order', order.orderNumber + (order.isRush ? '  RUSH' : ''), margin, y)
  keyValue(doc, 'Client', order.clientName, margin + 45, y)
  keyValue(doc, 'Ready by', pdfDate(order.dueDate), margin + 110, y)
  keyValue(doc, 'Fitting', order.fittingDate ? pdfDate(order.fittingDate) : 'None', margin + 150, y)
  y += 14
  keyValue(doc, 'Garment', `${styleLabel(order)} x${order.quantity}`, margin, y)
  keyValue(doc, 'Assigned to', order.assignedName ?? 'Unassigned', margin + 110, y)
  y += 14
  keyValue(doc, 'Fabric', order.fabricSource === 'shop' ? 'Shop supplies' : 'Client brought fabric', margin, y)
  keyValue(doc, 'Status', STATUS_LABEL[order.status], margin + 110, y)
  y += 12

  if (order.fabricNotes) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(60, 66, 80)
    const l = doc.splitTextToSize('Fabric notes: ' + order.fabricNotes, pageW - margin * 2)
    doc.text(l, margin, y); y += l.length * 5 + 3
  }

  // Style notes
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20, 24, 48)
  doc.text('Style', margin, y); y += 6
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(50, 56, 70)
  const notes = doc.splitTextToSize(order.styleNotes || 'No style notes.', pageW - margin * 2)
  doc.text(notes, margin, y); y += notes.length * 5 + 6

  // Measurements in two columns
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20, 24, 48)
  const m = order.measurement
  doc.text(m ? `Measurements: ${m.label} (${m.unit === 'cm' ? 'centimetres' : 'inches'})` : 'Measurements', margin, y)
  y += 3
  if (!m) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(120, 126, 140)
    doc.text('No measurements attached to this order.', margin, y + 6); y += 12
  } else {
    const rows = measurementRows(m)
    const colW = (pageW - margin * 2 - 8) / 2
    const half = Math.ceil(rows.length / 2)
    const startY = y + 4
    rows.forEach(([label, value], i) => {
      const col = i < half ? 0 : 1
      const r   = i < half ? i : i - half
      const x   = margin + col * (colW + 8)
      const ry  = startY + r * 7.5
      if (r % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(x, ry - 1, colW, 7.5, 'F') }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(60, 66, 80)
      doc.text(label, x + 2, ry + 4)
      doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 24, 48)
      doc.text(String(value), x + colW - 2, ry + 4, { align: 'right' })
    })
    y = startY + half * 7.5 + 4
    if (m.notes) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(60, 66, 80)
      const l = doc.splitTextToSize('Notes: ' + m.notes, pageW - margin * 2)
      doc.text(l, margin, y + 2); y += l.length * 5 + 4
    }
  }

  // Sign off boxes
  y = Math.max(y + 6, doc.internal.pageSize.getHeight() - 40)
  const boxes = ['Cut by', 'Sewn by', 'Checked by']
  const bw = (pageW - margin * 2 - 12) / 3
  boxes.forEach((b, i) => {
    const x = margin + i * (bw + 6)
    doc.setDrawColor(203, 213, 225); doc.rect(x, y, bw, 18)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120, 126, 140)
    doc.text(b.toUpperCase(), x + 3, y + 5)
  })

  doc.save(`${order.orderNumber}-job-card.pdf`)
}
