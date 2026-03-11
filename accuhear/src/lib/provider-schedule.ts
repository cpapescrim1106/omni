export type ProviderDaySchedule = {
  startMinute: number;
  endMinute: number;
  isActive: boolean;
  lunchStartMinute: number | null;
  lunchEndMinute: number | null;
};

export type ProviderScheduleMap = Record<string, Record<number, ProviderDaySchedule>>;

export function hasLunchBreak(schedule: ProviderDaySchedule | null | undefined): boolean {
  return (
    schedule != null &&
    schedule.lunchStartMinute != null &&
    schedule.lunchEndMinute != null &&
    schedule.lunchEndMinute > schedule.lunchStartMinute
  );
}

export function isMinuteWithinLunchBreak(
  schedule: ProviderDaySchedule | null | undefined,
  minuteInDay: number
): boolean {
  return hasLunchBreak(schedule)
    ? minuteInDay >= schedule!.lunchStartMinute! && minuteInDay < schedule!.lunchEndMinute!
    : false;
}

export function isMinuteWithinSchedule(
  schedule: ProviderDaySchedule | null | undefined,
  minuteInDay: number
): boolean {
  if (!schedule?.isActive) return false;
  if (minuteInDay < schedule.startMinute || minuteInDay >= schedule.endMinute) return false;
  return !isMinuteWithinLunchBreak(schedule, minuteInDay);
}

export function isTimeRangeWithinSchedule(
  schedule: ProviderDaySchedule | null | undefined,
  startMinuteInDay: number,
  endMinuteInDay: number
): boolean {
  if (!schedule?.isActive) return false;
  if (endMinuteInDay <= startMinuteInDay) return false;
  if (startMinuteInDay < schedule.startMinute || endMinuteInDay > schedule.endMinute) return false;
  if (!hasLunchBreak(schedule)) return true;
  return !(
    startMinuteInDay < schedule.lunchEndMinute! &&
    endMinuteInDay > schedule.lunchStartMinute!
  );
}
