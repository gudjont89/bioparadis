package `is`.bioparadis.app.data.model

import java.time.LocalDate
import java.time.LocalTime

data class Screening(
    val movie: Movie,
    val date: LocalDate,
    val time: LocalTime,
    val subtitleType: String,
    val ticketUrl: String,
    val events: List<EventType>,
    val lane: Int,
)
