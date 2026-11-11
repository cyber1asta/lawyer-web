import { addDays, pad } from './format'
import type { AppNotification, CaseFile, CaseStatus, Court, NoticeStatus, OfficeProfile, Session } from './types'

export const seedCities = [
  'الدار البيضاء',
  'الرباط',
  'سلا',
  'تمارة',
  'مراكش',
  'فاس',
  'مكناس',
  'طنجة',
  'تطوان',
  'أكادير',
  'وجدة',
  'القنيطرة',
  'المحمدية',
  'الجديدة',
  'آسفي',
  'الصويرة',
  'بني ملال',
  'خريبكة',
  'سطات',
  'الناظور',
  'الحسيمة',
  'تازة',
  'العرائش',
  'ورزازات',
  'العيون',
  'الداخلة',
  'كلميم',
  'الخميسات',
  'برشيد',
  'الرشيدية',
  'وزان',
]

const courtDefs: [string, string][] = [
  ['المحكمة الابتدائية المدنية بالدار البيضاء', 'الدار البيضاء'],
  ['المحكمة الابتدائية بالرباط', 'الرباط'],
  ['المحكمة الابتدائية بمراكش', 'مراكش'],
  ['المحكمة الابتدائية بفاس', 'فاس'],
  ['المحكمة الابتدائية بطنجة', 'طنجة'],
  ['المحكمة الابتدائية بأكادير', 'أكادير'],
  ['المحكمة الابتدائية بالقنيطرة', 'القنيطرة'],
  ['محكمة الاستئناف بالدار البيضاء', 'الدار البيضاء'],
  ['محكمة الاستئناف بالرباط', 'الرباط'],
  ['محكمة الاستئناف بفاس', 'فاس'],
  ['المحكمة التجارية بالدار البيضاء', 'الدار البيضاء'],
  ['المحكمة التجارية بمراكش', 'مراكش'],
  ['محكمة الاستئناف التجارية بالدار البيضاء', 'الدار البيضاء'],
  ['المحكمة الإدارية بالرباط', 'الرباط'],
  ['المحكمة الإدارية بأكادير', 'أكادير'],
  ['محكمة الاستئناف الإدارية بالرباط', 'الرباط'],
  ['قسم قضاء الأسرة بالدار البيضاء', 'الدار البيضاء'],
  ['قسم قضاء الأسرة بمراكش', 'مراكش'],
  ['قسم القضاء الاجتماعي بالدار البيضاء', 'الدار البيضاء'],
  ['قسم القضاء الاجتماعي بطنجة', 'طنجة'],
  ['المحكمة الابتدائية الزجرية بالدار البيضاء', 'الدار البيضاء'],
  ['محكمة النقض بالرباط', 'الرباط'],
]

export const seedCourts: Court[] = courtDefs.map(([name, city], i) => ({ id: `court_${i + 1}`, name, city }))

export const seedCaseTypes = [
  'مدنية',
  'تجارية - شيك بدون رصيد',
  'تجارية - أمر بالأداء',
  'عقارية وتحفيظ',
  'كراء',
  'أسرة - طلاق',
  'أسرة - نفقة',
  'أسرة - حضانة',
  'أسرة - إرث',
  'شغل',
  'جنحية',
  'جنائية',
  'إدارية',
  'استعجالية',
  'تنفيذ',
  'حجز تحفظي',
  'استئنافية',
  'نقض',
]

export const seedNoticeMethods = [
  'استدعاء',
  'عن طريق مفوض قضائي',
  'كتابة الضبط',
  'بريد مضمون',
  'تسليم باليد',
]

export const seedOffice: OfficeProfile = {
  officeName: 'مكتب الأستاذ حسناء',
  lawyerName: 'الأستاذ حسناء المريني',
  bar: 'هيئة المحامين بالرباط',
  city: 'الرباط',
  phone: '06.99.54.64.12',
}

const maleNames = ['أحمد', 'يوسف', 'عبد الله', 'رشيد', 'محمد', 'كريم', 'هشام', 'عمر', 'سعيد', 'مصطفى', 'إدريس', 'حمزة', 'أيوب', 'نبيل', 'طارق', 'خالد', 'المهدي', 'ياسين', 'إبراهيم', 'عثمان']
const femaleNames = ['خديجة', 'سعاد', 'فاطمة الزهراء', 'نادية', 'ليلى', 'إيمان', 'سناء', 'مريم', 'حنان', 'زينب', 'هند', 'أسماء', 'نزهة', 'سلمى', 'كوثر']
const families = ['الإدريسي', 'الفاسي', 'الطاهري', 'بنجلون', 'القادري', 'المرابط', 'الحداوي', 'العلمي', 'الشرقاوي', 'السعدي', 'بوعزة', 'الصنهاجي', 'التازي', 'البقالي', 'الوزاني', 'العمراني', 'الزياني', 'الكتاني', 'بناني', 'الرحماني']
const fathers = ['عبد الرحيم', 'محمد', 'حسن', 'عمر', 'إبراهيم', 'علي', 'أحمد', 'حسين', 'يوسف', 'إدريس', 'مصطفى', 'عبد القادر', 'العربي', 'الحسين', 'عبد السلام']
const mothers = ['زينب', 'فاطمة', 'سعاد', 'حليمة', 'مريم', 'خدوج', 'عائشة', 'أمينة', 'ربيعة', 'حفيظة', 'سميرة', 'لطيفة', 'رقية', 'الزهرة', 'نعيمة']
const opponents = ['شركة الأطلس للتجهيز', 'يوسف الإدريسي', 'البنك الشعبي', 'شركة سوس للنقل', 'نجيب العلوي', 'جماعة الدار البيضاء', 'شركة النور العقارية', 'سعيد بنموسى', 'الوكالة الحضرية', 'حسناء المريني']
const statusCycle: CaseStatus[] = ['active', 'active', 'postponed', 'judged', 'active', 'appealed', 'active', 'postponed', 'judged', 'archived']
const noticeCycle: NoticeStatus[] = ['received', 'received', 'pending', 'not_received', 'received']
const notesBank = [
  'تم تسليم الوثائق الأصلية للمكتب، في انتظار الرد على المذكرة قبل الجلسة المقبلة.',
  'الموكل يطلب الصلح، يجب التواصل مع دفاع الطرف الآخر.',
  'إعداد مذكرة جوابية وإرفاق شهادة الملكية.',
  'طلب إجراء خبرة حسابية، في انتظار تعيين الخبير.',
  'تم أداء الرسوم القضائية بصندوق المحكمة.',
  '',
]

function courtForType(type: string, i: number) {
  const pick = (keyword: string) => {
    const list = seedCourts.filter((c) => c.name.includes(keyword))
    return list[i % list.length].name
  }
  if (type.startsWith('أسرة')) return pick('قضاء الأسرة')
  if (type.startsWith('تجارية')) return pick('المحكمة التجارية')
  if (type === 'إدارية') return pick('المحكمة الإدارية')
  if (type === 'شغل') return pick('القضاء الاجتماعي')
  if (type === 'جنحية') return pick('الزجرية')
  if (type === 'جنائية' || type === 'استئنافية') return pick('محكمة الاستئناف ب')
  if (type === 'نقض') return pick('النقض')
  return pick('المحكمة الابتدائية')
}

function courtCode(type: string) {
  if (type.startsWith('أسرة')) return '1626'
  if (type.startsWith('تجارية')) return '8202'
  if (type === 'إدارية') return '7110'
  if (type === 'شغل') return '1501'
  if (type === 'جنحية') return '2103'
  if (type === 'عقارية وتحفيظ') return '1403'
  if (type === 'كراء') return '1303'
  return '1201'
}

function buildCases(): CaseFile[] {
  return Array.from({ length: 50 }, (_, i) => {
    const gender = i % 3 === 1 ? 'f' : 'm'
    const firstName = gender === 'f' ? femaleNames[i % femaleNames.length] : maleNames[i % maleNames.length]
    const type = seedCaseTypes[(i * 7) % seedCaseTypes.length]
    const court = courtForType(type, i)
    const caseDate = addDays('2026-06-05', -i * 4)
    const noticeStatus = noticeCycle[i % noticeCycle.length]
    const seq = 150 - i * 2
    const amount = type.startsWith('تجارية') || type === 'مدنية' || type === 'كراء' ? 5000 + ((i * 3517) % 180000) : null
    return {
      id: `case_${i + 1}`,
      ref: `ق-2026-${String(seq).padStart(4, '0')}`,
      courtRef: `${120 + ((i * 37) % 870)}/${courtCode(type)}/2026`,
      firstName,
      familyName: families[(i * 3) % families.length],
      gender,
      fatherName: fathers[(i * 5) % fathers.length],
      motherName: mothers[(i * 2) % mothers.length],
      phone: `06${pad(10 + ((i * 13) % 89))}${pad((i * 7) % 100)}${pad((i * 11) % 100)}${pad((i * 17) % 100)}`,
      cin: `${['BE', 'A', 'BK', 'J', 'G', 'EE', 'C'][i % 7]}${100000 + ((i * 7919) % 899999)}`,
      city: seedCities[i % 12],
      caseDate,
      type,
      court,
      opponent: opponents[i % opponents.length],
      amount,
      noticeDate: noticeStatus === 'received' ? addDays(caseDate, 3 + (i % 9)) : null,
      noticeMethod: seedNoticeMethods[i % seedNoticeMethods.length],
      noticeStatus,
      status: statusCycle[i % statusCycle.length],
      notes: notesBank[i % notesBank.length],
      createdAt: caseDate,
    } satisfies CaseFile
  })
}

export const seedCasesData = buildCases()

const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:30', '15:00']

function buildSessions(cases: CaseFile[]): Session[] {
  const openCases = cases.filter((c) => c.status === 'active' || c.status === 'postponed' || c.status === 'appealed')
  return Array.from({ length: 20 }, (_, i) => {
    const c = openCases[i % openCases.length]
    const kind = i % 6 === 4 ? 'consultation' : i % 6 === 5 ? 'client' : i % 9 === 3 ? 'deadline' : 'hearing'
    const date = addDays('2026-06-01', i * 2 + (i % 3))
    return {
      id: `session_${i + 1}`,
      title:
        kind === 'hearing'
          ? 'جلسة المناقشة'
          : kind === 'consultation'
            ? 'استشارة قانونية'
            : kind === 'client'
              ? 'لقاء مع الموكل'
              : 'آخر أجل لتقديم المذكرة',
      caseId: c.id,
      date,
      time: times[i % times.length],
      court: kind === 'hearing' || kind === 'deadline' ? c.court : 'مقر المكتب',
      room: kind === 'hearing' ? `القاعة ${1 + (i % 6)}` : '',
      kind,
      status: date < '2026-06-10' ? 'done' : 'scheduled',
      note: '',
    } satisfies Session
  })
}

export const seedSessionsData = buildSessions(seedCasesData)

export const seedNotificationsData: AppNotification[] = [
  {
    id: 'n1',
    title: 'تم التوصل بالإشعار',
    body: `توصل الطرف الآخر بالإشعار في الملف ${seedCasesData[1].ref}`,
    date: '2026-06-10',
    read: false,
    caseId: seedCasesData[1].id,
  },
  {
    id: 'n2',
    title: 'جلسة غدا',
    body: `جلسة في الملف ${seedCasesData[0].ref} على الساعة 09:00`,
    date: '2026-06-10',
    read: false,
    caseId: seedCasesData[0].id,
  },
  {
    id: 'n3',
    title: 'لم يتم التوصل',
    body: `تعذر تبليغ الاستدعاء في الملف ${seedCasesData[3].ref}، يلزم تجديد الإجراء`,
    date: '2026-06-09',
    read: false,
    caseId: seedCasesData[3].id,
  },
  {
    id: 'n4',
    title: 'صدور حكم',
    body: `صدر الحكم في الملف ${seedCasesData[3].ref}`,
    date: '2026-06-08',
    read: true,
    caseId: seedCasesData[3].id,
  },
]
