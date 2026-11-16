// Check organizations against the public IRS record (via ProPublica Nonprofit Explorer, which republishes the
// IRS Exempt Organizations Business Master File). READ-ONLY: it never writes to Firestore.
//
//   Check one EIN:
//     node scripts/verifyOrgs.mjs 53-0196605 --name "American National Red Cross" --state DC
//
//   Re-check every organization in Firestore (run monthly -- this is the "is it STILL a 501(c)(3)?" job):
//     node scripts/verifyOrgs.mjs --audit               # local emulators
//     USE_EMULATOR=false GCLOUD_PROJECT=<id> node scripts/verifyOrgs.mjs --audit
//     add --json for machine-readable output. Exit code is 2 if any org FAILS, so it can gate a cron/CI job.
//
// An EIN passes only if the IRS lists it as subsection 03 (501(c)(3)) with exempt status 01 (unconditional
// exemption) AND its legal name and state match what the organization told us. Anything else is REVIEW or FAIL
// for a human to look at. Note this script verifies the ORGANIZATION; confirming that the person who registered it
// is affiliated with it is the admin's job (see the checklist in the admin org page).

import { connectFirestore } from './_admin.mjs'

const API = 'https://projects.propublica.org/nonprofits/api/v2/organizations/'
const REQUEST_GAP_MS = 1200 // be polite to a free public API
const WORDS_TO_IGNORE = new Set(['inc', 'incorporated', 'corp', 'corporation', 'co', 'llc', 'the', 'of', 'and', 'a', 'an', 'for', 'in'])

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const option = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

export function normalizeEin(input) {
  const digits = String(input ?? '').replace(/[\s-]/g, '')
  return /^\d{9}$/.test(digits) ? digits : null
}

const tokens = (name) =>
  String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !WORDS_TO_IGNORE.has(t))

export function nameSimilarity(a, b) {
  const A = new Set(tokens(a))
  const B = new Set(tokens(b))
  if (A.size === 0 || B.size === 0) return 0
  let shared = 0
  for (const t of A) if (B.has(t)) shared += 1
  return shared / Math.min(A.size, B.size) // containment: "Paws Rescue" inside "Paws Rescue Of Newark"
}

export async function lookup(ein) {
  const response = await fetch(`${API}${ein}.json`, { headers: { Accept: 'application/json' } })
  if (response.status === 404) return { found: false }
  if (!response.ok) throw new Error(`ProPublica returned HTTP ${response.status}`)
  const { organization: org, filings_with_data: filings = [] } = await response.json()
  // For an EIN the IRS has never heard of, the API answers 200 with a placeholder: judge by the codes.
  if (!org || org.subsection_code == null || org.name === 'Unknown Organization') return { found: false }
  return {
    found: true,
    name: org.name,
    state: org.state,
    subsection: org.subsection_code,
    exemptStatus: org.exempt_organization_status_code,
    deductible: org.deductibility_code,
    rulingDate: org.ruling_date,
    lastFilingYear: filings.length ? Math.max(...filings.map((f) => f.tax_prd_yr)) : null,
  }
}

export function evaluate(record, { legalName, name, state }) {
  if (!record.found) return { verdict: 'FAIL', reasons: ['EIN not found in IRS records'] }
  const reasons = []
  const is501c3 = record.subsection === 3
  const active = record.exemptStatus === 1
  if (!is501c3) reasons.push(`IRS subsection is ${record.subsection}, not 03 (501(c)(3))`)
  if (!active) reasons.push(`IRS exempt status is ${record.exemptStatus}, not 01 (unconditional exemption)`)
  const similarity = Math.max(nameSimilarity(legalName, record.name), nameSimilarity(name, record.name))
  const nameOk = similarity >= 0.6
  if (!nameOk) reasons.push(`name mismatch: IRS says "${record.name}", org says "${legalName ?? name}"`)
  const stateOk = !state || !record.state || String(state).trim().toUpperCase() === record.state
  if (!stateOk) reasons.push(`state mismatch: IRS says ${record.state}, org says ${state}`)
  const thisYear = new Date().getFullYear()
  if (record.lastFilingYear && record.lastFilingYear < thisYear - 4) {
    reasons.push(`last Form 990 on file is for ${record.lastFilingYear} (may be delinquent or revoked)`)
  }
  const verdict = !is501c3 || !active ? 'FAIL' : !nameOk || !stateOk ? 'REVIEW' : reasons.length ? 'REVIEW' : 'PASS'
  return { verdict, reasons }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function checkOne() {
  const ein = normalizeEin(args.find((a) => !a.startsWith('--') && normalizeEin(a)))
  if (!ein) {
    console.error('Usage: node scripts/verifyOrgs.mjs <EIN> [--name "Legal name"] [--state NJ]\n   or: node scripts/verifyOrgs.mjs --audit [--json]')
    process.exit(1)
  }
  const record = await lookup(ein)
  const result = evaluate(record, { legalName: option('--name'), state: option('--state') })
  console.log(JSON.stringify({ ein: `${ein.slice(0, 2)}-${ein.slice(2)}`, ...record, ...result }, null, 2))
  process.exit(result.verdict === 'FAIL' ? 2 : 0)
}

async function audit() {
  const db = connectFirestore()
  const snapshot = await db.collection('organizations').get()
  const rows = []
  for (const doc of snapshot.docs) {
    const org = doc.data()
    const row = { orgId: doc.id, name: org.name, status: org.status, ein: org.ein ?? null, adminStamp: !!org.irsVerifiedAt }
    const ein = normalizeEin(org.ein)
    if (!ein) {
      rows.push({ ...row, verdict: org.status === 'approved' ? 'FAIL' : 'REVIEW', reasons: ['no EIN on file'] })
      continue
    }
    try {
      const result = evaluate(await lookup(ein), { legalName: org.legalName, name: org.name, state: org.address?.state })
      if (org.status === 'approved' && !org.irsVerifiedAt) result.reasons.push('approved but never admin-verified')
      rows.push({ ...row, ...result })
    } catch (error) {
      rows.push({ ...row, verdict: 'REVIEW', reasons: [`lookup failed: ${error.message}`] })
    }
    await sleep(REQUEST_GAP_MS)
  }

  if (flag('--json')) {
    console.log(JSON.stringify(rows, null, 2))
  } else {
    for (const r of rows) {
      console.log(`${r.verdict.padEnd(6)} ${String(r.status).padEnd(9)} ${String(r.name).slice(0, 38).padEnd(38)} ${r.ein ?? '(none)'}`)
      for (const reason of r.reasons ?? []) console.log(`         - ${reason}`)
    }
    const count = (v) => rows.filter((r) => r.verdict === v).length
    console.log(`\n${rows.length} organizations: ${count('PASS')} pass, ${count('REVIEW')} need review, ${count('FAIL')} fail`)
    console.log('Approved organizations that FAIL should be suspended until an admin resolves them.')
  }
  process.exit(rows.some((r) => r.verdict === 'FAIL') ? 2 : 0)
}

if (flag('--audit')) await audit()
else await checkOne()
