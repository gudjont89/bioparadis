package `is`.bioparadis.app.data.local.db

import androidx.room.TypeConverter
import `is`.bioparadis.app.data.model.EventType

class Converters {

    @TypeConverter
    fun fromEventList(value: String): List<EventType> {
        if (value.isBlank()) return emptyList()
        return value.split(",").mapNotNull { name ->
            EventType.entries.firstOrNull { it.name == name }
        }
    }

    @TypeConverter
    fun toEventList(events: List<EventType>): String {
        return events.joinToString(",") { it.name }
    }
}
