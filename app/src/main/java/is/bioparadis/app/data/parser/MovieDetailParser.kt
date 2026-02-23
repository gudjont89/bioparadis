package `is`.bioparadis.app.data.parser

import org.jsoup.Jsoup

object MovieDetailParser {

    fun parseRuntime(html: String): Int? {
        val doc = Jsoup.parse(html)
        val text = doc.body().text()
        val match = Regex("""Lengd:\s*(\d+)\s*mín""").find(text)
        return match?.groupValues?.get(1)?.toIntOrNull()
    }
}
