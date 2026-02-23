package `is`.bioparadis.app.data.parser

import `is`.bioparadis.app.data.model.EventType
import org.jsoup.Jsoup

data class EventPageInfo(
    val slug: String,
    val url: String,
    val eventType: EventType?,
)

object NavMenuParser {

    private val SLUG_TO_EVENT = mapOf(
        "partisyningar" to EventType.PARTY,
        "svartir-sunnudagar" to EventType.BLACK_SUNDAY,
        "midvikudagsbio" to EventType.MIDVIKU,
        "biotekid" to EventType.BIOTEKID,
    )

    private val KEYWORD_TO_EVENT = listOf(
        "thyskir" to EventType.GERMAN_DAYS,
        "german" to EventType.GERMAN_DAYS,
        "fronsk" to EventType.FRENCH_DAYS,
        "french" to EventType.FRENCH_DAYS,
    )

    fun parseEventPages(html: String): List<EventPageInfo> {
        val doc = Jsoup.parse(html)
        val results = mutableListOf<EventPageInfo>()

        // Find links under the "Viðburðir" nav section
        val eventLinks = doc.select("a[href*=/vidburdir/]")

        for (link in eventLinks) {
            val href = link.attr("href")
            val slug = extractSlug(href) ?: continue

            val eventType = resolveEventType(slug)
            results.add(EventPageInfo(slug = slug, url = href, eventType = eventType))
        }

        return results.distinctBy { it.slug }
    }

    private fun extractSlug(url: String): String? {
        val match = Regex("""/vidburdir/([^/]+)/?""").find(url)
        return match?.groupValues?.get(1)
    }

    private fun resolveEventType(slug: String): EventType? {
        SLUG_TO_EVENT[slug]?.let { return it }

        val lower = slug.lowercase()
        for ((keyword, event) in KEYWORD_TO_EVENT) {
            if (lower.contains(keyword)) return event
        }

        return null
    }
}
