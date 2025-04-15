export class MonthUtil {

  public monthMap() {
    return {
      jan: 'JANUARY',
      feb: 'FEBRUARY',
      mar: 'MARCH',
      apr: 'APRIL',
      may: 'MAY',
      jun: 'JUNE',
      jul: 'JULY',
      aug: 'AUGUST',
      sep: 'SEPTEMBER',
      oct: 'OCTOBER',
      nov: 'NOVEMBER',
      dec: 'DECEMBER'
    } as { [key: string]: string }

  }

  public monthsShort() {
    return [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
    ]
  }

  public months() {
    return [
      'JANUARY',
      'FEBRUARY',
      'MARCH',
      'APRIL',
      'MAY',
      'JUNE',
      'JULY',
      'AUGUST',
      'SEPTEMBER',
      'OCTOBER',
      'NOVEMBER',
      'DECEMBER'
    ]
  }


  public monthOrder() {
    return {
      JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4,
      MAY: 5, JUNE: 6, JULY: 7, AUGUST: 8,
      SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12,
    } as Record<string, number>
  }


}
