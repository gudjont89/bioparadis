package `is`.bioparadis.app.data.parser

import org.jsoup.Jsoup

object EventPageParser {

    fun parseTicketUrls(html: String): List<String> {
        val doc = Jsoup.parse(html)
        return doc.select("a[href*=tickets.bioparadis.is/#/book/]")
            .map { it.attr("href") }
            .distinct()
    }
}
