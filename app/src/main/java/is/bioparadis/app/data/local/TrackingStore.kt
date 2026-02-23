package `is`.bioparadis.app.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import `is`.bioparadis.app.data.model.TrackingStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "tracking")

class TrackingStore(private val context: Context) {

    fun observeAll(): Flow<Map<String, TrackingStatus>> {
        return context.dataStore.data.map { prefs ->
            prefs.asMap().entries
                .filter { it.key.name.startsWith("track_") }
                .mapNotNull { (key, value) ->
                    val movieId = key.name.removePrefix("track_")
                    val status = try {
                        TrackingStatus.valueOf(value as String)
                    } catch (_: Exception) {
                        null
                    }
                    if (status != null) movieId to status else null
                }
                .toMap()
        }
    }

    suspend fun setTracking(movieId: String, status: TrackingStatus?) {
        val key = stringPreferencesKey("track_$movieId")
        context.dataStore.edit { prefs ->
            if (status == null) {
                prefs.remove(key)
            } else {
                prefs[key] = status.name
            }
        }
    }
}
