package `is`.bioparadis.app.data.model

import java.time.LocalDate

data class DaySchedule(
    val date: LocalDate,
    val label: String,
    val sublabel: String?,
    val screenings: List<Screening>,
)
