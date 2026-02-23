package `is`.bioparadis.app.data.local.db

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow

@Dao
interface ScreeningDao {

    @Upsert
    suspend fun upsertAll(screenings: List<ScreeningEntity>)

    @Query("SELECT * FROM screenings WHERE date = :date ORDER BY time")
    fun observeByDate(date: String): Flow<List<ScreeningEntity>>

    @Query("SELECT * FROM screenings WHERE movieId = :movieId ORDER BY date, time")
    suspend fun getAllForMovie(movieId: String): List<ScreeningEntity>

    @Query("DELETE FROM screenings")
    suspend fun clearAll()

    @Query("SELECT DISTINCT date FROM screenings ORDER BY date")
    fun observeAvailableDates(): Flow<List<String>>
}
