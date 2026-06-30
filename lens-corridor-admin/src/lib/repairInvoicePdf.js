const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const PAGE_MARGIN = 52
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2

export async function buildRepairInvoicePdf(input) {
  const content = []
  const logoImage = input.logoUri ? await loadPdfImageFromUri(input.logoUri).catch(() => null) : null

  const push = (line) => {
    content.push(line)
  }

  const escapePdfText = (value) => (
    String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\r?\n/g, ' ')
  )

  const toPdfY = (top) => PAGE_HEIGHT - top
  const estimateTextWidth = (text, size) => String(text || '').length * size * 0.5

  const drawText = (x, top, size, text, bold = false) => {
    push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x} ${toPdfY(top)} Tm (${escapePdfText(text)}) Tj ET`)
  }

  const drawRightText = (right, top, size, text, bold = false) => {
    const width = estimateTextWidth(text, size)
    drawText(right - width, top, size, text, bold)
  }

  const drawCenteredText = (left, top, width, size, text, bold = false) => {
    const textWidth = estimateTextWidth(text, size)
    drawText(left + (width - textWidth) / 2, top, size, text, bold)
  }

  const drawLine = (x1, top1, x2, top2) => {
    push(`${x1} ${toPdfY(top1)} m ${x2} ${toPdfY(top2)} l S`)
  }

  const drawRect = (x, top, width, height, fill = false) => {
    push(`${x} ${PAGE_HEIGHT - top - height} ${width} ${height} re ${fill ? 'B' : 'S'}`)
  }

  const drawImage = (name, x, top, width, height) => {
    push(`q ${width} 0 0 ${height} ${x} ${PAGE_HEIGHT - top - height} cm /${name} Do Q`)
  }

  const setStrokeGray = (gray) => {
    push(`${gray} G`)
  }

  const setFillGray = (gray) => {
    push(`${gray} g`)
  }

  const setStrokeRgb = (red, green, blue) => {
    push(`${red} ${green} ${blue} RG`)
  }

  const drawCircle = (centerX, centerY, radius, fill = false) => {
    const control = radius * 0.5522847498
    const left = centerX - radius
    const right = centerX + radius
    const top = centerY - radius
    const bottom = centerY + radius

    push([
      `${centerX} ${toPdfY(top)} m`,
      `${centerX + control} ${toPdfY(top)} ${right} ${toPdfY(centerY - control)} ${right} ${toPdfY(centerY)} c`,
      `${right} ${toPdfY(centerY + control)} ${centerX + control} ${toPdfY(bottom)} ${centerX} ${toPdfY(bottom)} c`,
      `${centerX - control} ${toPdfY(bottom)} ${left} ${toPdfY(centerY + control)} ${left} ${toPdfY(centerY)} c`,
      `${left} ${toPdfY(centerY - control)} ${centerX - control} ${toPdfY(top)} ${centerX} ${toPdfY(top)} c`,
      fill ? 'b' : 'S',
    ].join(' '))
  }

  const drawBrandLogo = (left, top) => {
    const logoBlue = [0.086, 0.435, 0.898]

    push('2.6 w')
    setStrokeRgb(...logoBlue)
    drawCircle(left + 11, top + 12, 6, false)
    drawCircle(left + 29, top + 12, 6, false)
    drawLine(left + 17, top + 12, left + 23, top + 12)

    setFillGray(0)
    drawText(left + 42, top + 16, 20, 'Lens Corridor', true)
  }

  const drawSection = (top, title, bodyHeight) => {
    const totalHeight = 30 + bodyHeight
    setStrokeGray(0.82)
    drawRect(PAGE_MARGIN, top, CONTENT_WIDTH, totalHeight)
    setFillGray(0.97)
    drawRect(PAGE_MARGIN, top, CONTENT_WIDTH, 30, true)
    setFillGray(0)
    setStrokeGray(0.82)
    drawLine(PAGE_MARGIN, top + 30, PAGE_MARGIN + CONTENT_WIDTH, top + 30)
    drawText(PAGE_MARGIN + 12, top + 19, 12, title, true)
    return {
      left: PAGE_MARGIN + 14,
      right: PAGE_MARGIN + CONTENT_WIDTH - 14,
      top: top + 30,
    }
  }

  const currency = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`
  const amountRows = [
    ['Estimated Amount', currency(input.estimatedAmount)],
    ['Advance Received', currency(input.advanceAmount)],
    ['Balance on Delivery', currency(input.remainingAmount)],
  ]

  push('0.8 w')
  setStrokeGray(0.25)
  setFillGray(0)

  if (logoImage) {
    const logoWidth = 138
    const logoHeight = logoWidth * (logoImage.height / logoImage.width)
    drawImage('Im1', PAGE_MARGIN, 42, logoWidth, logoHeight)
  } else {
    drawBrandLogo(PAGE_MARGIN, 48)
  }

  push('0.8 w')
  setStrokeGray(0.25)
  setFillGray(0)
  drawRightText(PAGE_MARGIN + CONTENT_WIDTH, 52, 18, 'REPAIR INVOICE', true)
  drawRightText(PAGE_MARGIN + CONTENT_WIDTH, 74, 10.5, `Ref: ${input.referenceNumber || '-'}`)
  drawRightText(PAGE_MARGIN + CONTENT_WIDTH, 90, 10.5, `Date: ${input.invoiceDate || '-'}`)
  drawLine(PAGE_MARGIN, 112, PAGE_MARGIN + CONTENT_WIDTH, 112)

  const customerSection = drawSection(136, 'Customer & Order', 96)
  drawText(customerSection.left, customerSection.top + 18, 11, input.customerName || 'Customer', true)
  drawText(customerSection.left, customerSection.top + 38, 10, input.phone || 'Phone not added')
  drawText(customerSection.left, customerSection.top + 58, 10, `Original Invoice: ${input.orderNumber || '-'}`)
  drawText(customerSection.left, customerSection.top + 78, 10, `Store: ${input.storeName || 'Store not assigned'}`)

  const repairSection = drawSection(254, 'Repair Details', 112)
  drawText(repairSection.left, repairSection.top + 18, 10.5, `Repair Scope: ${input.repairScope || '-'}`)
  drawText(repairSection.left, repairSection.top + 38, 10.5, `Issue: ${input.issueType || '-'}`)
  drawText(repairSection.left, repairSection.top + 58, 10.5, `Expected Delivery: ${input.expectedDeliveryDate || '-'}`)
  drawText(repairSection.left, repairSection.top + 78, 10.5, `Status: ${input.status || 'Requested'}`)
  drawText(repairSection.left, repairSection.top + 98, 10.5, 'Remarks:', true)
  wrapText(input.remarks || 'No additional remarks', 66).forEach((line, index) => {
    drawText(repairSection.left + 56, repairSection.top + 98 + index * 14, 9.5, line)
  })

  const amountSection = drawSection(416, 'Amount Summary', 106)
  const tableTop = amountSection.top + 16
  const tableLeft = amountSection.left
  const tableWidth = CONTENT_WIDTH - 28
  const priceColumnWidth = 150
  const rowHeight = 28
  const tableHeight = rowHeight * (amountRows.length + 1)

  setStrokeGray(0.78)
  drawRect(tableLeft, tableTop, tableWidth, tableHeight)
  setFillGray(0.965)
  drawRect(tableLeft, tableTop, tableWidth, rowHeight, true)
  setFillGray(0)
  setStrokeGray(0.78)
  drawLine(tableLeft + tableWidth - priceColumnWidth, tableTop, tableLeft + tableWidth - priceColumnWidth, tableTop + tableHeight)

  for (let index = 1; index <= amountRows.length; index += 1) {
    const y = tableTop + index * rowHeight
    drawLine(tableLeft, y, tableLeft + tableWidth, y)
  }

  drawText(tableLeft + 10, tableTop + 18, 10, 'Description', true)
  drawRightText(tableLeft + tableWidth - 10, tableTop + 18, 10, 'Amount', true)

  amountRows.forEach(([label, value], index) => {
    const rowTop = tableTop + rowHeight * (index + 1)
    const emphasize = label === 'Balance on Delivery'
    drawText(tableLeft + 10, rowTop + 18, 9.8, label, emphasize)
    drawRightText(tableLeft + tableWidth - 10, rowTop + 18, 9.8, value, emphasize)
  })

  drawCenteredText(PAGE_MARGIN, 564, CONTENT_WIDTH, 10, 'Please carry this repair invoice at the time of delivery.')
  drawCenteredText(PAGE_MARGIN, 580, CONTENT_WIDTH, 10, 'Support: support@lenscorridor.com')

  const contentStream = content.join('\n')
  const imageObjectNumber = logoImage ? 6 : null
  const contentObjectNumber = logoImage ? 7 : 6
  const xObjectResource = logoImage ? ` /XObject << /Im1 ${imageObjectNumber} 0 R >>` : ''
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >>${xObjectResource} >> /Contents ${contentObjectNumber} 0 R >> endobj`,
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj',
  ]

  if (logoImage && imageObjectNumber) {
    const imageStream = bytesToPdfBinaryString(logoImage.data)
    objects.push(
      `${imageObjectNumber} 0 obj << /Type /XObject /Subtype /Image /Width ${logoImage.width} /Height ${logoImage.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ${imageStream.length} >> stream\n${imageStream}\nendstream endobj`
    )
  }

  objects.push(`${contentObjectNumber} 0 obj << /Length ${contentStream.length} >> stream\n${contentStream}\nendstream endobj`)

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((object) => {
    offsets.push(pdf.length)
    pdf += `${object}\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new Uint8Array([...pdf].map((char) => char.charCodeAt(0)))
}

function bytesToPdfBinaryString(bytes) {
  let result = ''

  for (let index = 0; index < bytes.length; index += 1) {
    result += String.fromCharCode(bytes[index])
  }

  return result
}

async function loadPdfImageFromUri(uri) {
  if (typeof document === 'undefined') {
    return null
  }

  return new Promise((resolve, reject) => {
    const image = document.createElement('img')
    image.decoding = 'async'

    image.onload = () => {
      const width = image.naturalWidth || image.width
      const height = image.naturalHeight || image.height
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Unable to prepare invoice logo.'))
        return
      }

      context.clearRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)

      const source = context.getImageData(0, 0, width, height).data
      const rgb = new Uint8Array(width * height * 3)

      for (let sourceIndex = 0, targetIndex = 0; sourceIndex < source.length; sourceIndex += 4, targetIndex += 3) {
        const alpha = source[sourceIndex + 3] / 255
        rgb[targetIndex] = Math.round(source[sourceIndex] * alpha + 255 * (1 - alpha))
        rgb[targetIndex + 1] = Math.round(source[sourceIndex + 1] * alpha + 255 * (1 - alpha))
        rgb[targetIndex + 2] = Math.round(source[sourceIndex + 2] * alpha + 255 * (1 - alpha))
      }

      resolve({ width, height, data: rgb })
    }

    image.onerror = () => reject(new Error('Unable to load invoice logo.'))
    image.src = uri
  })
}

function wrapText(text, maxCharsPerLine) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current)
      current = word
      return
    }

    current = candidate
  })

  if (current) {
    lines.push(current)
  }

  return lines.slice(0, 3)
}
