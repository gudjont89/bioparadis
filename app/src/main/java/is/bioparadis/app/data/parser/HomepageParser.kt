package `is`.bioparadis.app.data.parser

import org.jsoup.Jsoup
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
)

object HomepageParser {

    private val ICELANDIC_MONTHS = mapOf(
        "jan" to 1, "feb" to 2, "mar" to 3, "apr" to 4,
        "maí" to 5, "jún" to 6, "júl" to 7, "ágú" to 8,
        "sep" to 9, "okt" to 10, "nóv" to 11, "des" to 12,
    )

    private val DAY_NAMES = mapOf(
        "Mán" to "Mon", "Þri" to "Tue", "Mið" to "Wed",
        "Fim" to "Thu", "Fös" to "Fri", "Lau" to "Sat", "Sun" to "Sun",
    )

    fun parse(html: String): List<DayData> {
        val doc = Jsoup.parse(html)
        val result = mutableListOf<DayData>()

        // Find date tabs — they are <li> elements inside the date selector
        val dateTabs = doc.select("ul.schedule-dates li, ul.dates li, .date-tabs li, .day-selector li")
        // Fallback: look for any tab-like structure with date text
        val tabs = if (dateTabs.isNotEmpty()) dateTabs else doc.select("li").filter { li ->
            val text = li.text()
            ICELANDIC_MONTHS.keys.any { text.lowercase().contains(it) }
        }

        // Find screening sections — each day has a section/div/ul with movie listings
        val sections = doc.select("ul.schedule-day, .schedule-section, .day-screenings")
        val fallbackSections = if (sections.isNotEmpty()) sections else {
            // The site renders all days in one page; look for structures that contain
            // movie listings with ticket links
            doc.select("ul").filter { ul ->
                ul.select("a[href*=tickets.bioparadis.is]").isNotEmpty()
            }
        }

        // Parse dates from tabs
        val dates = tabs.mapNotNull { tab -> parseDateFromText(tab.text()) }

        // If we couldn't find structured tabs, try to parse the page more broadly
        if (dates.isEmpty() || fallbackSections.isEmpty()) {
            return parseFallback(doc)
        }

        // Match each date with its screening section
        for ((index, date) in dates.withIndex()) {
            val screenings = if (index < fallbackSections.size) {
                parseScreeningSection(fallbackSections[index])
            } else {
                emptyList()
            }

            val label = formatDateLabel(date)
            result.add(DayData(date = date, label = label, rawScreenings = screenings))
        }

        return result
    }

    private fun parseFallback(doc: org.jsoup.nodes.Document): List<DayData> {
        // Broad approach: find all movie blocks and group by context
        val result = mutableListOf<DayData>()
        val today = LocalDate.now()

        // Look for all elements that contain movie links and ticket links
        val movieBlocks = doc.select("li:has(a[href*=/mynd/]):has(a[href*=tickets.bioparadis.is])")

        if (movieBlocks.isEmpty()) return result

        // Group all screenings under today as a fallback
        val screenings = movieBlocks.flatMap { parseMovieBlock(it) }
        if (screenings.isNotEmpty()) {
            result.add(DayData(date = today, label = formatDateLabel(today), rawScreenings = screenings))
        }

        return result
    }

    private fun parseScreeningSection(section: org.jsoup.nodes.Element): List<RawScreening> {
        val movieBlocks = section.select("li:has(a[href*=/mynd/])")
        return movieBlocks.flatMap { parseMovieBlock(it) }
    }

    private fun parseMovieBlock(block: org.jsoup.nodes.Element): List<RawScreening> {
        val results = mutableListOf<RawScreening>()

        // Movie detail link: /mynd/{id}_{slug}/
        val movieLink = block.selectFirst("a[href*=/mynd/]") ?: return results
        val detailUrl = movieLink.attr("href")
        val (movieId, movieSlug) = parseMovieIdSlug(detailUrl) ?: return results

        // Title from <h4> or the link text
        val title = block.selectFirst("h4")?.text()
            ?: movieLink.text().takeIf { it.isNotBlank() }
            ?: return results

        // Poster URL from <img>
        val posterUrl = block.selectFirst("img[src*=mycloudcinema]")?.attr("src")
            ?: block.selectFirst("img")?.attr("src")
            ?: ""

        // Showtimes: each <li> inside the inner <ul> has time + subtitle + ticket link
        val showtimeItems = block.select("ul li:has(a[href*=tickets.bioparadis.is])")

        for (item in showtimeItems) {
            val ticketLink = item.selectFirst("a[href*=tickets.bioparadis.is]") ?: continue
            val ticketUrl = ticketLink.attr("href")
            val text = item.text()

            // Extract time (HH:MM pattern)
            val timeMatch = Regex("""(\d{1,2}:\d{2})""").find(text)
            val time = timeMatch?.value ?: continue

            // Extract subtitle type (everything between time and "KAUPA"/"BUY")
            val subtitleType = extractSubtitleType(text)

            results.add(
                RawScreening(
                    movieId = movieId,
                    movieSlug = movieSlug,
                    movieTitle = title.trim(),
                    posterUrl = posterUrl,
                    detailUrl = detailUrl,
                    time = time,
                    subtitleType = subtitleType,
                    ticketUrl = ticketUrl,
                )
            )
        }

        return results
    }

    private fun parseMovieIdSlug(url: String): Pair<String, String>? {
        // URL format: /mynd/{id}_{slug}/ or https://bioparadis.is/mynd/{id}_{slug}/
        val match = Regex("""/mynd/(\d+)_([^/]+)/?""").find(url) ?: return null
        return match.groupValues[1] to match.groupValues[2]
    }

    private fun extractSubtitleType(text: String): String {
        return when {
            text.contains("ENG SUB", ignoreCase = true) -> "ENG SUB"
            text.contains("ICE SUB", ignoreCase = true) -> "ICE SUB"
            text.contains("NO SUB", ignoreCase = true) -> "NO SUB"
            text.contains("ÍSL TAL", ignoreCase = true) -> "ÍSL TAL"
            else -> ""
        }
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
