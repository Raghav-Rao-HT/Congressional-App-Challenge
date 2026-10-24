import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Organization, OrgAddress, OrgLocation, OrgMember, OrgStatus } from '../../types/models'

export async function createOrganization(params: {
  submittedByUid: string
  submittedByDisplayName: string
  name: string
  legalName: string
  address: OrgAddress
  location: OrgLocation
  contactEmail: string
  contactPhone: string
  website: string
  causeArea: string
  nonprofitType: string | null
}): Promise<string> {
  const orgRef = doc(collection(db, 'organizations'))
  const now = Date.now()

  // Two sequential writes rather than one atomic batch: the security rule
  // for the officer doc below confirms org ownership via a get() on the org
  // document, which needs the org doc to already be committed to read back.
  // A crash between these two writes leaves an org with no officer — an
  // acceptable, recoverable MVP edge case over the added complexity of
  // reconciling that inside a transaction.
  await setDoc(orgRef, {
    orgId: orgRef.id,
    name: params.name,
    legalName: params.legalName,
    address: params.address,
    location: params.location,
    contactEmail: params.contactEmail,
    contactPhone: params.contactPhone,
    website: params.website,
    causeArea: params.causeArea,
    nonprofitType: params.nonprofitType,
    status: 'pending',
    submittedByUid: params.submittedByUid,
    createdAt: now,
    reviewedAt: null,
    reviewedByAdminUid: null,
    rejectionReason: null,
    memberCount: 1,
  } satisfies Organization)

  const officerRef = doc(db, 'organizations', orgRef.id, 'members', params.submittedByUid)
  await setDoc(officerRef, {
    uid: params.submittedByUid,
    displayName: params.submittedByDisplayName,
    status: 'approved',
    roleInOrg: 'officer',
    appliedAt: now,
    approvedAt: now,
    approvedByUid: params.submittedByUid,
    totalHoursApprovedForOrg: 0,
  } satisfies OrgMember)

  return orgRef.id
}

export function subscribeMyOrganization(
  uid: string,
  onChange: (org: Organization | null) => void,
): () => void {
  const q = query(collection(db, 'organizations'), where('submittedByUid', '==', uid))
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.empty ? null : (snapshot.docs[0].data() as Organization))
  })
}

export function subscribeApprovedOrganizations(
  onChange: (orgs: Organization[]) => void,
): () => void {
  const q = query(collection(db, 'organizations'), where('status', '==', 'approved'))
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => d.data() as Organization))
  })
}

export function subscribeOrgMembers(
  orgId: string,
  onChange: (members: OrgMember[]) => void,
): () => void {
  const q = query(collection(db, 'organizations', orgId, 'members'), orderBy('appliedAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => d.data() as OrgMember))
  })
}

export async function applyToOrganization(params: {
  orgId: string
  uid: string
  displayName: string
}): Promise<void> {
  const ref = doc(db, 'organizations', params.orgId, 'members', params.uid)
  await setDoc(ref, {
    uid: params.uid,
    displayName: params.displayName,
    status: 'applied',
    roleInOrg: 'member',
    appliedAt: Date.now(),
    approvedAt: null,
    approvedByUid: null,
    totalHoursApprovedForOrg: 0,
  } satisfies OrgMember)
}

export async function getMyApplications(uid: string): Promise<Record<string, OrgMember>> {
  const q = query(collectionGroup(db, 'members'), where('uid', '==', uid))
  const snapshot = await getDocs(q)
  const result: Record<string, OrgMember> = {}
  snapshot.docs.forEach((d) => {
    const orgId = d.ref.parent.parent?.id
    if (orgId) result[orgId] = d.data() as OrgMember
  })
  return result
}

export async function setMemberStatus(params: {
  orgId: string
  memberUid: string
  status: 'approved' | 'rejected'
  reviewerUid: string
}): Promise<void> {
  const ref = doc(db, 'organizations', params.orgId, 'members', params.memberUid)
  await updateDoc(ref, {
    status: params.status,
    approvedAt: params.status === 'approved' ? Date.now() : null,
    approvedByUid: params.reviewerUid,
  })
}

export function subscribeOrganizationsByStatus(
  status: OrgStatus,
  onChange: (orgs: Organization[]) => void,
): () => void {
  const q = query(collection(db, 'organizations'), where('status', '==', status))
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => d.data() as Organization))
  })
}

export function subscribeOrganization(
  orgId: string,
  onChange: (org: Organization | null) => void,
): () => void {
  return onSnapshot(doc(db, 'organizations', orgId), (snapshot) => {
    onChange(snapshot.exists() ? (snapshot.data() as Organization) : null)
  })
}

export async function approveOrganization(params: {
  orgId: string
  submittedByUid: string
  adminUid: string
}): Promise<void> {
  await updateDoc(doc(db, 'organizations', params.orgId), {
    status: 'approved',
    reviewedAt: Date.now(),
    reviewedByAdminUid: params.adminUid,
    rejectionReason: null,
  })
  // Admin-only exception on users/{uid}: the rules allow an admin to touch
  // only this one field, so an org's officer learns their org is approved
  // without otherwise being able to edit each other's profiles.
  await updateDoc(doc(db, 'users', params.submittedByUid), {
    orgId: params.orgId,
  })
}

export async function rejectOrganization(params: {
  orgId: string
  adminUid: string
  reason: string
}): Promise<void> {
  await updateDoc(doc(db, 'organizations', params.orgId), {
    status: 'rejected',
    reviewedAt: Date.now(),
    reviewedByAdminUid: params.adminUid,
    rejectionReason: params.reason,
  })
}
