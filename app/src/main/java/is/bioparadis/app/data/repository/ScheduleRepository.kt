package `is`.bioparadis.app.data.repository

import android.util.Log
import `is`.bioparadis.app.data.local.TrackingStore
import `is`.bioparadis.app.data.local.db.AppDatabase
import `is`.bioparadis.app.data.local.db.MovieEntity
import `is`.bioparadis.app.data.local.db.ScreeningEntity
import `is`.bioparadis.app.data.model.DaySchedule
import `is`.bioparadis.app.data.model.EventType
import `is`.bioparadis.app.data.model.Movie
import `is`.bioparadis.app.data.model.Screening
import `is`.bioparadis.app.data.model.TrackingStatus
import `is`.bioparadis.app.data.parser.EventPageParser
import `is`.bioparadis.app.data.parser.HomepageParser
import `is`.bioparadis.app.data.parser.MovieDetailParser
import `is`.bioparadis.app.data.parser.NavMenuParser
import `is`.bioparadis.app.data.parser.RawScreening
import `is`.bioparadis.app.data.remote.BioParadisApi
import `is`.bioparadis.app.domain.LaneAssigner
import `is`.bioparadis.app.domain.MovieColorAssigner
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import java.time.LocalDate
import java.time.LocalTime

private const val TAG = "ScheduleRepo"
private const val DEFAULT_RUNTIME = 90

class ScheduleRepository(
    private val api: BioParadisApi,
    private val db: AppDatabase,
    private val trackingStore: TrackingStore,
) {

    fun observeDays(): Flow<List<DaySchedule>> {
        return db.screeningDao().observeAvailableDates().map { dateStrings ->
            val today = LocalDate.now()
            dateStrings.map { dateStr ->
                val date = LocalDate.parse(dateStr)
                val label = formatDateLabel(date)
                val sublabel = if (date == today) "Today" else null
                DaySchedule(
                    date = date,
                    label = label,
                    sublabel = sublabel,
                    screenings = emptyList(), // populated when date is selected
                )
            }
        }
    }

    fun observeScreeningsForDate(date: LocalDate): Flow<List<Screening>> {
        return combine(
            db.screeningDao().observeByDate(date.toString()),
            db.movieDao().observeAll(),
        ) { screeningEntities, movieEntities ->
            val movieMap = movieEntities.associateBy { it.id }
            screeningEntities.mapNotNull { entity ->
                val movieEntity = movieMap[entity.movieId] ?: return@mapNotNull null
                toScreening(entity, movieEntity)
            }
        }
    }

    fun observeTracking(): Flow<Map<String, TrackingStatus>> {
        return trackingStore.observeAll()
    }

    suspend fun setTracking(movieId: String, status: TrackingStatus?) {
        trackingStore.setTracking(movieId, status)
    }

    suspend fun getAllScreeningsForMovie(movieId: String): List<Screening> {
        val movieEntity = db.movieDao().getById(movieId) ?: return emptyList()
        return db.screeningDao().getAllForMovie(movieId).map { entity ->
            toScreening(entity, movieEntity)
        }
    }

    suspend fun refresh(): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            // Step 1: Fetch and parse homepage
            val homepageHtml = api.getHomepage().string()
            val dayDataList = HomepageParser.parse(homepageHtml)
            val eventPageInfos = NavMenuParser.parseEventPages(homepageHtml)

            Log.d(TAG, "Parsed ${dayDataList.size} days, ${eventPageInfos.size} event pages")

            if (dayDataList.isEmpty()) {
                Log.w(TAG, "No days parsed from homepage")
                return@runCatching
            }

            // Step 2: Fetch event subpages in parallel → build ticket URL → event type map
            val eventMap = coroutineScope {
                val deferreds = eventPageInfos
                    .filter { it.eventType != null }
                    .map { info ->
                        async {
                            try {
                                val html = api.getEventPage(info.url.trimStart('/')).string()
                                val ticketUrls = EventPageParser.parseTicketUrls(html)
                                ticketUrls.map { it to info.eventType!! }
                            } catch (e: Exception) {
                                Log.w(TAG, "Failed to fetch event page ${info.slug}", e)
                                emptyList()
                            }
                        }
                    }
                val pairs = deferreds.awaitAll().flatten()
                // Group by ticket URL → list of event types
                pairs.groupBy({ it.first }, { it.second })
            }

            Log.d(TAG, "Event map: ${eventMap.size} ticket URLs mapped")

            // Step 3: Fetch movie detail pages in parallel → extract runtimes
            val allRawScreenings = dayDataList.flatMap { it.rawScreenings }
            val uniqueMovies = allRawScreenings
                .map { it.movieId to it }
                .distinctBy { it.first }

            val runtimeMap = coroutineScope {
                val deferreds = uniqueMovies.map { (_, raw) ->
                    async {
                        try {
                            val slug = "${raw.movieId}_${raw.movieSlug}"
                            val html = api.getMovieDetail(slug).string()
                            val runtime = MovieDetailParser.parseRuntime(html)
                            raw.movieId to (runtime ?: DEFAULT_RUNTIME)
                        } catch (e: Exception) {
                            Log.w(TAG, "Failed to fetch detail for ${raw.movieId}", e)
                            raw.movieId to DEFAULT_RUNTIME
                        }
                    }
                }
                deferreds.awaitAll().toMap()
            }

            Log.d(TAG, "Runtimes fetched for ${runtimeMap.size} movies")

            // Step 4-5: Build domain models, assign events, assign lanes
            val movieEntities = mutableMapOf<String, MovieEntity>()
            val allScreenings = mutableListOf<Screening>()

            for (dayData in dayDataList) {
                val dayScreenings = dayData.rawScreenings.map { raw ->
                    val runtime = runtimeMap[raw.movieId] ?: DEFAULT_RUNTIME
                    val events = eventMap[raw.ticketUrl] ?: emptyList()
                    val color = MovieColorAssigner.colorForMovie(raw.movieId)

                    movieEntities[raw.movieId] = MovieEntity(
                        id = raw.movieId,
                        slug = raw.movieSlug,
                        title = raw.movieTitle,
                        runtime = runtime,
                        posterUrl = raw.posterUrl,
                        detailUrl = raw.detailUrl,
                        color = color,
                    )

                    Screening(
                        movie = Movie(
                            id = raw.movieId,
                            slug = raw.movieSlug,
                            title = raw.movieTitle,
                            runtime = runtime,
                            posterUrl = raw.posterUrl,
                            detailUrl = raw.detailUrl,
                            color = color,
                        ),
                        date = dayData.date,
                        time = LocalTime.parse(raw.time),
                        subtitleType = raw.subtitleType,
                        ticketUrl = raw.ticketUrl,
                        events = events,
                        lane = 0,
                    )
                }

                // Assign lanes
                val withLanes = LaneAssigner.assignLanes(dayScreenings)
                allScreenings.addAll(withLanes)
            }

            // Step 6: Persist to Room
            db.screeningDao().clearAll()
            db.movieDao().upsertAll(movieEntities.values.toList())
            db.screeningDao().upsertAll(allScreenings.map { screening ->
                ScreeningEntity(
                    ticketUrl = screening.ticketUrl,
                    movieId = screening.movie.id,
                    date = screening.date.toString(),
                    time = screening.time.toString(),
                    subtitleType = screening.subtitleType,
                    events = screening.events.joinToString(",") { it.name },
                    lane = screening.lane,
                )
            })

            Log.d(TAG, "Persisted ${movieEntities.size} movies, ${allScreenings.size} screenings")
        }
    }

    private fun toScreening(entity: ScreeningEntity, movieEntity: MovieEntity): Screening {
        val events = if (entity.events.isBlank()) emptyList()
        else entity.events.split(",").mapNotNull { name ->
            EventType.entries.firstOrNull { it.name == name }
        }

        return Screening(
            movie = Movie(
                id = movieEntity.id,
                slug = movieEntity.slug,
                title = movieEntity.title,
                runtime = movieEntity.runtime,
                posterUrl = movieEntity.posterUrl,
                detailUrl = movieEntity.detailUrl,
                color = movieEntity.color,
            ),
            date = LocalDate.parse(entity.date),
            time = LocalTime.parse(entity.time),
            subtitleType = entity.subtitleType,
            ticketUrl = entity.ticketUrl,
            events = events,
            lane = entity.lane,
        )
    }

    private fun formatDateLabel(date: LocalDate): String {
        val dayOfWeek = when (date.dayOfWeek.value) {
            1 -> "Mon"; 2 -> "Tue"; 3 -> "Wed"; 4 -> "Thu"
            5 -> "Fri"; 6 -> "Sat"; 7 -> "Sun"; else -> ""
        }
        return "$dayOfWeek ${date.dayOfMonth}"
    }
}
