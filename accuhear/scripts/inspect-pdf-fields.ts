import { PDFDocument } from 'pdf-lib'
import { readFile } from 'fs/promises'
import path from 'path'

const FORMS_DIR = path.resolve(__dirname, '../var/manufacturer-forms')

const PDF_FILES = [
  'oticon/bte-earmold.pdf',
  'oticon/custom-device.pdf',
  'oticon/minirite-earmold-polaris.pdf',
  'oticon/minirite-earmold-sirius.pdf',
  'signia/custom-device.pdf',
  'signia/ric-earmold.pdf',
  'starkey/custom-device.pdf',
  'starkey/earmold.pdf',
  'starkey/ric-receiver.pdf',
  'starkey/signature-series-custom.pdf',
]

function getFieldType(field: any): string {
  const constructor = field.constructor?.name
  if (constructor) return constructor
  return 'Unknown'
}

async function inspectPdf(relativePath: string) {
  const fullPath = path.join(FORMS_DIR, relativePath)
  console.log(`\n${'='.repeat(80)}`)
  console.log(`FILE: ${relativePath}`)
  console.log('='.repeat(80))

  try {
    const bytes = await readFile(fullPath)
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true })
    const form = pdfDoc.getForm()
    const fields = form.getFields()

    if (fields.length === 0) {
      console.log('  (no AcroForm fields found)')
      return
    }

    console.log(`  Fields: ${fields.length}\n`)

    for (const field of fields) {
      const name = field.getName()
      const type = getFieldType(field)
      let extra = ''

      if (type === 'PDFDropdown') {
        const dd = field as any
        try {
          const options = dd.getOptions?.() ?? []
          if (options.length > 0) {
            extra = ` | options: [${options.map((o: string) => `"${o}"`).join(', ')}]`
          }
        } catch {}
      }

      if (type === 'PDFRadioGroup') {
        const rg = field as any
        try {
          const options = rg.getOptions?.() ?? []
          if (options.length > 0) {
            extra = ` | options: [${options.map((o: string) => `"${o}"`).join(', ')}]`
          }
        } catch {}
      }

      if (type === 'PDFCheckBox') {
        const cb = field as any
        try {
          const checked = cb.isChecked?.()
          extra = ` | default: ${checked ? 'checked' : 'unchecked'}`
        } catch {}
      }

      if (type === 'PDFTextField') {
        const tf = field as any
        try {
          const text = tf.getText?.() ?? ''
          if (text) {
            extra = ` | value: "${text}"`
          }
        } catch {}
      }

      console.log(`  [${type}] "${name}"${extra}`)
    }
  } catch (err: any) {
    console.log(`  ERROR: ${err.message}`)
  }
}

async function main() {
  console.log('PDF AcroForm Field Inspector')
  console.log(`Forms directory: ${FORMS_DIR}`)

  for (const file of PDF_FILES) {
    await inspectPdf(file)
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log('Done.')
}

main()
