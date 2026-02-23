package `is`.bioparadis.app.data.local.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "movies")
data class MovieEntity(
    @PrimaryKey val id: String,
    val slug: String,
    val title: String,
    val runtime: Int,
    val posterUrl: String,
    val detailUrl: String,
    val color: Int,
)
