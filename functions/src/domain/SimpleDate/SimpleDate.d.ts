import Year from "./Year";
import Month from "./Month";
import Week from "./Week";
import Day from "./Day";
import Weekday from "./Weekday";

export interface SimpleDate {
  year: Year
  month: Month
  week: Week
  day: Day

  weekday: Weekday
}
