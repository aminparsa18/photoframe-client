import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const OUTPUT_PATH = fileURLToPath(new URL('../calendar-data/calendar.ics', import.meta.url))
const TMP_PATH = `${OUTPUT_PATH}.tmp`

async function main() {
  const url = process.env.CALENDAR_ICS_URL
  if (!url) {
    console.error('CALENDAR_ICS_URL is not set')
    process.exitCode = 1
    return
  }

  let response
  try {
    response = await fetch(url)
  } catch (error) {
    console.error(`Failed to reach calendar URL: ${error.message}`)
    process.exitCode = 1
    return
  }

  if (!response.ok) {
    console.error(`Calendar request failed with status ${response.status}`)
    process.exitCode = 1
    return
  }

  const text = await response.text()
  if (!text.startsWith('BEGIN:VCALENDAR')) {
    console.error('Response does not look like a valid ICS feed')
    process.exitCode = 1
    return
  }

  await fs.mkdir(new URL('../calendar-data/', import.meta.url), { recursive: true })

  try {
    await fs.writeFile(TMP_PATH, text, 'utf8')
    await fs.rename(TMP_PATH, OUTPUT_PATH)
  } catch (error) {
    await fs.rm(TMP_PATH, { force: true })
    throw error
  }

  console.log(`Synced ${text.length} bytes to calendar-data/calendar.ics at ${new Date().toISOString()}`)
}

await main()
