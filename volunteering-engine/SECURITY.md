# VetWork security notes

VetWork is a React app that talks **directly** to Firebase (Auth + Firestore). There is no server code, so
`firestore.rules` is the only thing standing between a user's browser and the data. Anyone can open devtools, take
the public Firebase config out of the JS bundle, and call Firestore themselves. Every rule is therefore written and
tested as if the UI did not exist.

This repo is public: assume attackers can read the rules.

## Testing the rules

```bash
brew install openjdk            # the Firestore emulator needs Java
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
npm run test:rules
```

| Suite | What it proves |
| --- | --- |
| `rules-tests/firestore.rules.test.ts` | Each known attack is denied; each legitimate flow is allowed (including the multi-document approval transactions). |
| `rules-tests/client-contract.test.ts` | The app's **real** `src/lib/firestore/*` functions are accepted by the rules, and refused when an attacker calls them. If a payload and a rule drift apart, this fails. |
| `rules-tests/codes.test.ts` | The friend/join-code alphabet is identical in the app, the scripts and the rules pattern. |
| `rules-tests/legacy-vulnerabilities.test.ts` | The same attacks **succeeded** against the pre-hardening rules (`rules-tests/legacy/`). It is the proof the holes were real. |

To confirm the attack tests are meaningful, point them at the old rules; ~47 should fail:

```bash
RULES_FILE=rules-tests/legacy/firestore.rules.before-hardening \
  npx firebase emulators:exec --only firestore --project demo-vetwork-rules "npx vitest run rules-tests/firestore.rules.test.ts"
```

## Deploying this hardening to a project with real users — order matters

The new client and the new rules depend on each other **in both directions**:

* the new **rules** reject the old client (no `ageBand`/`ein`, an `email` on the profile, text limits…);
* the new **client** needs the new rules (signup writes a private contact document and a friend code, which the old rules deny).

So there is a short window between deploying one and the other in which **new signups fail**. Keep it to a few minutes
(do steps 4–6 back to back). Signup now deletes the half-created Auth account when the profile write fails, so nobody is
left stranded and can simply retry. Existing users keep working throughout.

1. **Audit before changing anything.** The old rules let any account edit its own points, so totals may already be
   tampered with. All scripts are read-only unless you pass `--apply`, and default to the local emulators:
   ```bash
   USE_EMULATOR=false GCLOUD_PROJECT=<project-id> node scripts/auditData.mjs
   USE_EMULATOR=false GCLOUD_PROJECT=<project-id> node scripts/verifyOrgs.mjs --audit
   USE_EMULATOR=false GCLOUD_PROJECT=<project-id> node scripts/migrateEmails.mjs          # dry run
   ```
   (Real-project runs use `gcloud auth application-default login`; never put a service-account key in this repo.)
2. **Confirm the rules currently deployed match `rules-tests/legacy/firestore.rules.before-hardening`** (Firebase console → Firestore → Rules). If they differ, diff before overwriting.
3. `npm run test:rules` must be green.
4. **Deploy hosting** (`npm run build && firebase deploy --only hosting`).
5. **Move the emails out of public profiles and give everyone a friend code:**
   `USE_EMULATOR=false GCLOUD_PROJECT=<project-id> node scripts/migrateEmails.mjs --apply` (idempotent; safe to re-run).
6. **Deploy rules** (`firebase deploy --only firestore:rules,storage`).
7. Watch the Firestore "denied requests" metric for a day. A spike on a legitimate flow means client and rules disagree: run the contract test.
8. Organizations approved before this change have no IRS stamp. Open each in **Admin → Organizations** and use *Record verification*, or suspend them. `verifyOrgs.mjs --audit` lists them.

## Switches that are deliberately OFF until you flip them

| Switch | Where | Why it is off |
| --- | --- | --- |
| Email-verification enforcement | `enforceEmailVerification()` in `firestore.rules` **and** `VITE_REQUIRE_VERIFIED_EMAIL=true` | Turning it on locks out every existing account whose email isn't verified (including demo/test accounts whose addresses can't receive mail). The client already sends a verification email at signup and shows a reminder banner. Flip both together once you've checked the user list. |
| App Check | `VITE_APPCHECK_SITE_KEY` + Firebase console | Register the web app (reCAPTCHA v3), run in *monitor* mode for a week, then *enforce* Firestore and Auth. |
| CSP | `Content-Security-Policy-Report-Only` in `firebase.json` / `public/_headers` | Browse the whole app with the console open; once there are no violations, rename the header to `Content-Security-Policy`. |

## Console settings no code change can make (do these by hand)

- **API key** (Google Cloud → APIs & Services → Credentials): restrict to your production domain(s) + `localhost`, and to the Identity Toolkit / Firestore / Token Service APIs. The key is public by design; the restriction limits abuse.
- **Authentication → Settings**: turn on *email enumeration protection*; set a *password policy*; trim *Authorized domains* to the ones you use.
- **Billing → Budgets & alerts**: set a budget with email alerts so abuse shows up as a bill, not a surprise.
- **Firestore → Disaster recovery**: enable point-in-time recovery / scheduled backups.
- The site-owner account (hard-coded in `firestore.rules` and `src/lib/roles.ts`) can promote admins. Give it a long unique password; enable MFA if you upgrade to Identity Platform.

## How the trust model works now

- A user can edit only `displayName`, `homeState`, `lastActiveAt` on their own profile. Points, hours, streaks, role and `orgId` cannot be self-edited.
- Only an **approved officer of an approved organization** can approve hours, and only for members of **their own** org (`isOfficerOfUser`). Officers cannot approve their own hours, change what was submitted, or exceed 24h / 1,000 points per write.
- An organization becomes `approved` only when an admin records an IRS check (well-formed EIN, who, when, what was checked). Officers cannot edit that stamp. A pending/rejected org can't approve hours, post events or admit members.
- **Students are not discoverable.** A profile carries no email (it lives in `users/{uid}/private/contact`, readable only by the owner and admins). Nobody but an admin can list users; the only list query ordinary users may run is the bounded leaderboard (`limit <= 200`). To connect, people exchange an unguessable **friend code** (`friendCodes/{code}`: fetchable by whoever holds the code, never listable).
- **Join codes** let an officer of an approved org admit people they trust instantly. A code works only for its own org while it is live, never for someone an officer rejected or removed, never grants officer rights or pre-credited hours, and the officer who issued it is recorded as the approver.
- Images are inline data URLs; the rules pin the scheme (`data:image/jpeg|png;base64,`) and cap the size, and the UI refuses to render anything else.

## Verifying 501(c)(3) status

1. Organization registers with an EIN.
2. Admin opens the org page → *Verify 501(c)(3) status*: follows the ProPublica / IRS links, ticks four checks (name+state match; recognized 501(c)(3), exempt status 01; not on the auto-revocation list; registrant affiliated), and the result is stamped on the org. `emailMatchesWebsite` pre-computes the cheapest affiliation signal.
3. `node scripts/verifyOrgs.mjs --audit` re-checks every org against the IRS record automatically (run it monthly; it exits 2 on any FAIL so it can gate a cron job). Browsers can't call ProPublica directly (no CORS), so the automated check lives in this script, not the UI.

"Accredited" is not an IRS concept. The check is **IRS-recognized and in good standing**. Churches and some small or fiscally-sponsored organizations don't appear in the IRS lists; decide as a policy whether to admit them (today they fail the check and need a manual decision).

## Known gaps — not done yet

- **Points and hours are still computed in the officer's browser.** The rules bound what a write may do (members of the officer's own org only, ≤24h and ≤1,000 points per write, monotonic), but a *legitimate officer of an approved org* can still award hours to their own members. Moving this to Cloud Functions removes that residual trust; it needs the Firebase **Blaze** plan, so it's your call.
- A **leaderboard still shows names** of members to every signed-in user (the profile fields it needs: name, state, points). Admins can hide people (`leaderboardHidden`). If you'd rather show initials or nicknames, that is a product decision.
- `isTestAccount` shortcuts remain in the production rules. Prefer a separate staging Firebase project and delete them.
- The `admin` custom claim (set by `scripts/setAdminClaim.mjs`) is honored by the rules but not by the UI; the UI uses `accountType`. Keep them in sync via the script, or remove the claim path.
- Free-text fields shown to other users (names, descriptions) are length-limited but not moderated.
- Join codes are shared by the officer, so a code posted publicly can be used by anyone who sees it. Replace or turn it off from **Members** if that happens.
- `npm audit` still reports `firebase`/`@grpc/grpc-js` findings whose only "fix" is a downgrade to Firebase v9. That package is the Node transport and isn't in the browser bundle; ignore until upstream ships a patch.
