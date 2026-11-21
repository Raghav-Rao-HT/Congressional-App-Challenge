// Read-only integrity audit of the data. Run it BEFORE deploying the hardened firestore.rules to a project that
// has real users: the old rules let any account edit its own points, so some totals may already be tampered with.
// It never writes anything.
//
//   node scripts/auditData.mjs                                   # local emulators
//   USE_EMULATOR=false GCLOUD_PROJECT=<id> node scripts/auditData.mjs
//   add --json for machine-readable output. Exit code is 2 if anything suspicious is found.

import { connectFirestore } from './_admin.mjs'

const TOLERANCE = 0.01
const MAX_LOG_HOURS = 24
const db = connectFirestore()

const [users, orgs, logs] = await Promise.all([
  db.collection('users').get(),
  db.collection('organizations').get(),
  db.collection('hourLogs').get(),
])

const findings = []
const add = (type, subject, detail) => findings.push({ type, subject, detail })

const orgById = new Map(orgs.docs.map((d) => [d.id, d.data()]))
const approvedHoursByMember = new Map()
for (const doc of logs.docs) {
  const log = doc.data()
  if (log.status === 'approved') {
    approvedHoursByMember.set(log.memberUid, (approvedHoursByMember.get(log.memberUid) ?? 0) + Number(log.hours || 0))
  }
  if (!(Number(log.hours) > 0) || Number(log.hours) > MAX_LOG_HOURS) {
    add('log-hours-out-of-range', doc.id, `${log.hours}h by ${log.memberUid} for org ${log.orgId}`)
  }
  const org = orgById.get(log.orgId)
  if (org && org.status !== 'approved' && log.status === 'approved') {
    add('approved-hours-from-unapproved-org', doc.id, `${log.hours}h approved in "${org.name}" (${org.status})`)
  }
  if (log.status === 'approved' && log.reviewedByUid === log.memberUid && !log.autoApproved) {
    add('self-approved-hours', doc.id, `${log.memberUid} approved their own ${log.hours}h`)
  }
}

for (const doc of users.docs) {
  const user = doc.data()
  if (user.accountType === 'admin') continue
  const expected = approvedHoursByMember.get(doc.id) ?? 0
  if (!user.isTestAccount && Math.abs(Number(user.totalHoursApproved || 0) - expected) > TOLERANCE) {
    add('hours-total-mismatch', doc.id, `profile says ${user.totalHoursApproved}h, approved logs add up to ${expected}h`)
  }
  if (!user.isTestAccount && Number(user.totalPoints || 0) > 0 && expected === 0) {
    add('points-without-hours', doc.id, `${user.totalPoints} points but no approved hours`)
  }
  if (user.accountType === 'organization_officer' && user.orgId) {
    const member = await db.doc(`organizations/${user.orgId}/members/${doc.id}`).get()
    const m = member.data()
    if (!member.exists || m.status !== 'approved' || m.roleInOrg !== 'officer') {
      add('officer-without-membership', doc.id, `profile points at org ${user.orgId} but has no approved officer record there`)
    }
  }
}

for (const doc of orgs.docs) {
  const org = doc.data()
  if (org.status === 'approved' && (!org.ein || !org.irsVerifiedAt)) {
    add('approved-org-not-irs-verified', doc.id, `"${org.name}" is approved with ${org.ein ? 'an unverified EIN' : 'no EIN'}`)
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(findings, null, 2))
} else {
  const byType = Object.groupBy(findings, (f) => f.type)
  for (const [type, items] of Object.entries(byType)) {
    console.log(`\n${type} (${items.length})`)
    for (const f of items.slice(0, 25)) console.log(`  ${f.subject}: ${f.detail}`)
    if (items.length > 25) console.log(`  ... and ${items.length - 25} more`)
  }
  console.log(`\n${users.size} users, ${orgs.size} organizations, ${logs.size} hour logs audited: ${findings.length} finding(s).`)
  if (findings.length) {
    console.log('Review each before deploying. Tampered totals can be corrected by an admin (Admin SDK bypasses rules).')
  }
}
process.exit(findings.length ? 2 : 0)
