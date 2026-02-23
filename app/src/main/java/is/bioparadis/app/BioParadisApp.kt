package `is`.bioparadis.app

import android.app.Application
import androidx.room.Room
import `is`.bioparadis.app.data.local.TrackingStore
import `is`.bioparadis.app.data.local.db.AppDatabase
import `is`.bioparadis.app.data.remote.NetworkModule
import `is`.bioparadis.app.data.repository.ScheduleRepository

class BioParadisApp : Application() {

    lateinit var repository: ScheduleRepository
        private set

    override fun onCreate() {
        super.onCreate()

        val client = NetworkModule.provideOkHttpClient()
        val api = NetworkModule.provideApi(client)
        val database = Room.databaseBuilder(this, AppDatabase::class.java, "bioparadis.db")
            .fallbackToDestructiveMigration()
            .build()
        val trackingStore = TrackingStore(this)

        repository = ScheduleRepository(api, database, trackingStore)
    }
}
