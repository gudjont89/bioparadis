package `is`.bioparadis.app.util

import java.time.LocalTime

fun LocalTime.toMinutesSinceMidnight(): Int = hour * 60 + minute

fun minutesToTimeString(totalMinutes: Int): String {
    val h = totalMinutes / 60
    val m = totalMinutes % 60
    return "${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}"
}

fun LocalTime.formatHHMM(): String {
    return "${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}"
}
