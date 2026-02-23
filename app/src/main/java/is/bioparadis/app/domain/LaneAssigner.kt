package `is`.bioparadis.app.domain

import `is`.bioparadis.app.data.model.Screening
import java.time.LocalTime

object LaneAssigner {

    private const val CHANGEOVER_MINUTES = 15L

    fun assignLanes(screenings: List<Screening>): List<Screening> {
        val sorted = screenings.sortedBy { it.time }
        val laneEndTimes = arrayOf(LocalTime.MIN, LocalTime.MIN, LocalTime.MIN)

        return sorted.map { screening ->
            val endTime = screening.time.plusMinutes(
                screening.movie.runtime.toLong() + CHANGEOVER_MINUTES
            )
            val lane = (0..2).firstOrNull { laneEndTimes[it] <= screening.time } ?: 0
            laneEndTimes[lane] = endTime
            screening.copy(lane = lane)
        }
    }
}
