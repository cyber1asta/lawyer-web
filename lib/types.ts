export type CaseStatus = 'active' | 'postponed' | 'judged' | 'appealed' | 'archived'
export type NoticeStatus = 'received' | 'pending' | 'not_received'
export type Gender = 'm' | 'f'

export interface CaseFile {
  id: string
  ref: string
  courtRef: string
  firstName: string
  familyName: string
  gender: Gender
  fatherName: string
  motherName: string
  phone: string
  cin: string
  city: string
  caseDate: string
  type: string
  court: string
  opponent: string
  amount: number | null
  noticeDate: string | null
  noticeMethod: string
  noticeStatus: NoticeStatus
  status: CaseStatus
  notes: string
  createdAt: string
}

export type CaseInput = Omit<CaseFile, 'id' | 'ref' | 'createdAt'>

export type SessionKind = 'hearing' | 'consultation' | 'client' | 'deadline'
export type SessionStatus = 'scheduled' | 'done' | 'postponed' | 'cancelled'

export interface Session {
  id: string
  title: string
  caseId: string | null
  date: string
  time: string
  court: string
  room: string
  kind: SessionKind
  status: SessionStatus
  note: string
}

export type SessionInput = Omit<Session, 'id'>

export interface AppNotification {
  id: string
  title: string
  body: string
  date: string
  read: boolean
  caseId: string | null
}

export interface Court {
  id: string
  name: string
  city: string
}

export type TrashItem =
  | { id: string; kind: 'case'; deletedAt: string; item: CaseFile }
  | { id: string; kind: 'session'; deletedAt: string; item: Session }

export interface OfficeProfile {
  officeName: string
  lawyerName: string
  bar: string
  city: string
  phone: string
}

export type ListKey = 'cities' | 'caseTypes' | 'noticeMethods'
