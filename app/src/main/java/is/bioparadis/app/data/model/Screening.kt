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
) {
    /** Unique identifier: ticket URL if available, else synthetic key */
    val uniqueId: String
        get() = if (ticketUrl.isNotEmpty()) ticketUrl else "${movie.id}_${date}_${time}"
}

