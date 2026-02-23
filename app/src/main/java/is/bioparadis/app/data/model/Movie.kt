package `is`.bioparadis.app.data.model

data class Movie(
    val id: String,
    val slug: String,
    val title: String,
    val runtime: Int,
    val posterUrl: String,
    val detailUrl: String,
    val color: Int,
)
