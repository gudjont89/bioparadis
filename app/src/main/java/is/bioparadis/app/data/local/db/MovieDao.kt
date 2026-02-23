package `is`.bioparadis.app.data.local.db

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow

@Dao
interface MovieDao {

    @Upsert
    suspend fun upsertAll(movies: List<MovieEntity>)

    @Query("SELECT * FROM movies WHERE id = :id")
    suspend fun getById(id: String): MovieEntity?

    @Query("SELECT * FROM movies")
    fun observeAll(): Flow<List<MovieEntity>>
}
