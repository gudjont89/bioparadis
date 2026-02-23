package `is`.bioparadis.app.util

import android.content.Intent
import android.provider.CalendarContract
import `is`.bioparadis.app.data.model.Screening
import java.time.ZoneId

object CalendarIntentHelper {

    fun createIntent(screening: Screening): Intent {
        val startMillis = screening.date
            .atTime(screening.time)
            .atZone(ZoneId.of("Atlantic/Reykjavik"))
            .toInstant()
            .toEpochMilli()
        val endMillis = startMillis + (screening.movie.runtime * 60 * 1000L)

        return Intent(Intent.ACTION_INSERT).apply {
            data = CalendarContract.Events.CONTENT_URI
            putExtra(CalendarContract.Events.TITLE, "Bíó Paradís: ${screening.movie.title}")
            putExtra(CalendarContract.Events.EVENT_LOCATION, "Hverfisgata 54, 101 Reykjavík")
            putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, startMillis)
            putExtra(CalendarContract.EXTRA_EVENT_END_TIME, endMillis)
            putExtra(CalendarContract.Events.DESCRIPTION, "Buy tickets: ${screening.ticketUrl}")
        }
    }
}
