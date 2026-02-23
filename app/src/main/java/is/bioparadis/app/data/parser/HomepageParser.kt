package `is`.bioparadis.app.data.parser

import org.jsoup.Jsoup
import org.jsoup.nodes.Element
import java.time.LocalDate

data class DayData(
    val date: LocalDate,
    val label: String,
    val rawScreenings: List<RawScreening>,
)

data class RawScreening(
    val movieId: String,
    val movieSlug: String,
    val movieTitle: String,
    val posterUrl: String,
    val detailUrl: String,
    val time: String,
    val subtitleType: String,
    val ticketUrl: String,
    val eventLabel: String = "",
)

object HomepageParser {

    private val ICELANDIC_MONTHS = mapOf(
        "jan" to 1, "feb" to 2, "mar" to 3, "apr" to 4,
        "maí" to 5, "jún" to 6, "júl" to 7, "ágú" to 8,
        "sep" to 9, "okt" to 10, "nóv" to 11, "des" to 12,
    )

    fun parse(html: String): List<DayData> {
        val doc = Jsoup.parse(html)
        val result = mutableListOf<DayData>()

        // Strategy 1: Find date tabs with data-div attributes (preferred)
        // These are <a class="getFilms" data-div="shows_2026-02-23">
        val dateTabs = doc.select("a.getFilms[data-div]")

        if (dateTabs.isNotEmpty()) {
            for (tab in dateTabs) {
                val divId = tab.attr("data-div") // e.g. "shows_2026-02-23"
                val date = parseDateFromDivId(divId) ?: continue
                val label = formatDateLabel(date)

                // Find the corresponding day section by id
                val dayDiv = doc.getElementById(divId)
                val screenings = if (dayDiv != null) {
                    parseDaySection(dayDiv)
                } else {
                    emptyList()
                }

                result.add(DayData(date = date, label = label, rawScreenings = screenings))
            }
            return result
        }

        // Strategy 2: Find div.shows sections directly by id pattern
        val showDivs = doc.select("div.shows[id^=shows_]")
        if (showDivs.isNotEmpty()) {
            for (div in showDivs) {
                val date = parseDateFromDivId(div.id()) ?: continue
                val label = formatDateLabel(date)
                val screenings = parseDaySection(div)
                result.add(DayData(date = date, label = label, rawScreenings = screenings))
            }
            return result
        }

        // Strategy 3: Fallback — look for date text in tab-like elements
        return parseFallback(doc)
    }

    private fun parseDateFromDivId(divId: String): LocalDate? {
        // Format: "shows_2026-02-23"
        val dateStr = divId.removePrefix("shows_")
        return try {
            LocalDate.parse(dateStr)
        } catch (_: Exception) {
            null
        }
    }

    private fun parseDaySection(dayDiv: Element): List<RawScreening> {
        val movieItems = dayDiv.select("li:has(a[href*=/mynd/])")
        return movieItems.flatMap { parseMovieBlock(it) }
    }

    private fun parseMovieBlock(block: Element): List<RawScreening> {
        val results = mutableListOf<RawScreening>()

        // Movie detail link: /mynd/{id}_{slug}/
        val movieLink = block.selectFirst("a[href*=/mynd/]") ?: return results
        val detailUrl = movieLink.attr("href")
        val (movieId, movieSlug) = parseMovieIdSlug(detailUrl) ?: return results

        // Title from <h4>
        val title = block.selectFirst("h4")?.text()?.trim()
            ?: movieLink.text().takeIf { it.isNotBlank() }?.trim()
            ?: return results

        // Poster URL from <img> (use src, as data-src is often empty)
        val posterUrl = block.selectFirst("img[src*=mycloudcinema]")?.attr("src")
            ?: block.selectFirst("img")?.attr("src")
            ?: ""

        // Event label from <span class="event"> on the poster
        val eventLabel = block.selectFirst("span.event")?.text()?.trim() ?: ""

        // Showtimes: each <li> inside <ul class="timar">
        val showtimeItems = block.select("ul.timar > li")

        for (item in showtimeItems) {
            // Time from <div class="top-showtime">
            val topShowtime = item.selectFirst("div.top-showtime")
            val timeText = topShowtime?.ownText()?.trim() ?: ""
            val timeMatch = Regex("""(\d{1,2}:\d{2})""").find(timeText)
            val time = timeMatch?.value ?: continue

            // Subtitle type from <span class="sub">
            val subtitleType = item.selectFirst("span.sub")?.text()?.trim() ?: ""

            // Ticket URL from the buy button link
            val ticketLink = item.selectFirst("div.bottom-buy-ticket a")
            val ticketUrl = ticketLink?.attr("href") ?: ""
            // Skip javascript:void(0) — treat as empty
            val resolvedTicketUrl = if (ticketUrl.startsWith("javascript:")) "" else ticketUrl

            results.add(
                RawScreening(
                    movieId = movieId,
                    movieSlug = movieSlug,
                    movieTitle = title,
                    posterUrl = posterUrl,
                    detailUrl = detailUrl,
                    time = time,
                    subtitleType = subtitleType,
                    ticketUrl = resolvedTicketUrl,
                    eventLabel = eventLabel,
                )
            )
        }

        return results
    }

    private fun parseFallback(doc: org.jsoup.nodes.Document): List<DayData> {
        val result = mutableListOf<DayData>()

        // Try to find any li elements with date text
        val tabs = doc.select("li").filter { li ->
            val text = li.text().lowercase()
            ICELANDIC_MONTHS.keys.any { text.contains(it) } &&
                Regex("""\d{1,2}\.\s*\w{3}""").containsMatchIn(text)
        }

        val dates = tabs.mapNotNull { parseDateFromText(it.text()) }

        // If we found date tabs, look for movie blocks grouped nearby
        if (dates.isEmpty()) {
            // Last resort: everything under today
            val today = LocalDate.now()
            val allMovieBlocks = doc.select("li:has(a[href*=/mynd/])")
            val screenings = allMovieBlocks.flatMap { parseMovieBlock(it) }
            if (screenings.isNotEmpty()) {
                result.add(DayData(date = today, label = formatDateLabel(today), rawScreenings = screenings))
            }
            return result
        }

        // Group all screenings per date if we can find the structure
        for (date in dates) {
            result.add(DayData(date = date, label = formatDateLabel(date), rawScreenings = emptyList()))
        }
        return result
    }

    private fun parseMovieIdSlug(url: String): Pair<String, String>? {
        // URL format: /mynd/{id}_{slug}/ or https://bioparadis.is/mynd/{id}_{slug}/
        val match = Regex("""/mynd/(\d+)_([^/]+)/?""").find(url) ?: return null
        return match.groupValues[1] to match.groupValues[2]
    }

    fun parseDateFromText(text: String): LocalDate? {
        // Formats: "Í dag (23. feb)", "Mán 24. feb", "24. feb", etc.
        val cleaned = text.lowercase().trim()

        val dayMatch = Regex("""(\d{1,2})\.\s*(\w{3})""").find(cleaned) ?: return null
        val day = dayMatch.groupValues[1].toIntOrNull() ?: return null
        val monthStr = dayMatch.groupValues[2]
        val month = ICELANDIC_MONTHS[monthStr] ?: return null

        val now = LocalDate.now()
        val year = if (month < now.monthValue - 1) now.year + 1 else now.year

        return try {
            LocalDate.of(year, month, day)
        } catch (_: Exception) {
            null
        }
    }

    private fun formatDateLabel(date: LocalDate): String {
        val dayOfWeek = when (date.dayOfWeek.value) {
            1 -> "Mon"
            2 -> "Tue"
            3 -> "Wed"
            4 -> "Thu"
            5 -> "Fri"
            6 -> "Sat"
            7 -> "Sun"
            else -> ""
        }
        return "$dayOfWeek ${date.dayOfMonth}"
    }
}
