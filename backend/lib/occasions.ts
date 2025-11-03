export function getCurrentOccasions(userBirthday?: Date, partnerBirthday?: Date, anniversary?: Date, religion?: string): string[] {
  const today = new Date()
  const occasions: string[] = []
  
  // Check birthdays (within 3 days)
  if (userBirthday && isWithinDays(today, userBirthday, 3)) {
    occasions.push('birthday')
  }
  if (partnerBirthday && isWithinDays(today, partnerBirthday, 3)) {
    occasions.push('birthday')
  }
  
  // Check anniversary (within 3 days)
  if (anniversary && isWithinDays(today, anniversary, 3)) {
    occasions.push('anniversary')
  }
  
  // Check holidays
  const month = today.getMonth() + 1
  const day = today.getDate()
  
  // Christmas season (Dec 20-26)
  if (month === 12 && day >= 20 && day <= 26) {
    occasions.push('christmas')
  }
  
  // Valentine's Day (Feb 10-14)
  if (month === 2 && day >= 10 && day <= 14) {
    occasions.push('valentine')
  }
  
  // New Year (Dec 28 - Jan 5)
  if ((month === 12 && day >= 28) || (month === 1 && day <= 5)) {
    occasions.push('new_year')
  }
  
  // Easter (approximate - 3rd or 4th Sunday in March/April)
  const easter = getEasterDate(today.getFullYear())
  if (isWithinDays(today, easter, 3)) {
    occasions.push('easter')
  }
  
  // Religious holidays based on user religion
  if (religion === 'muslim') {
    // Ramadan (approximate dates - would need proper Islamic calendar)
    if (isRamadanSeason(today)) {
      occasions.push('ramadan')
    }
  }
  
  if (religion === 'hindu') {
    // Diwali (approximate - October/November)
    if (isDiwaliSeason(today)) {
      occasions.push('diwali')
    }
  }
  
  return occasions
}

function isWithinDays(date1: Date, date2: Date, days: number): boolean {
  const thisYear = new Date(date1.getFullYear(), date2.getMonth(), date2.getDate())
  const diff = Math.abs(date1.getTime() - thisYear.getTime())
  return diff <= days * 24 * 60 * 60 * 1000
}

function getEasterDate(year: number): Date {
  // Simplified Easter calculation
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function isRamadanSeason(date: Date): boolean {
  // Simplified - would need proper Islamic calendar
  const month = date.getMonth() + 1
  return month >= 3 && month <= 5 // Approximate
}

function isDiwaliSeason(date: Date): boolean {
  const month = date.getMonth() + 1
  const day = date.getDate()
  return month === 10 || (month === 11 && day <= 15) // October-November
}