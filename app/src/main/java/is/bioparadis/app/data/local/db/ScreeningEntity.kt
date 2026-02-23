package `is`.bioparadis.app.data.local.db

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "screenings",
    foreignKeys = [ForeignKey(
        entity = MovieEntity::class,
        parentColumns = ["id"],
        childColumns = ["movieId"],
        onDelete = ForeignKey.CASCADE,
    )],
    indices = [Index("movieId"), Index("date")],
)
data class ScreeningEntity(
    @PrimaryKey val ticketUrl: String,
    val movieId: String,
    val date: String,
    val time: String,
    val subtitleType: String,
    val events: String,
    val lane: Int,
)
