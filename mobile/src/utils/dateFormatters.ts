import { format, parseISO } from 'date-fns'

export const formatDateLabel = (iso: string, pattern = 'EEE, MMM d') =>
  format(parseISO(iso), pattern)

export const formatPayrollRange = (start: string, end: string) =>
  `${format(parseISO(start), 'MMM d')} - ${format(parseISO(end), 'MMM d, yyyy')}`

export const formatDateTimeLabel = (iso: string, pattern = "MMM d, yyyy • h:mm a") =>
  format(parseISO(iso), pattern)
