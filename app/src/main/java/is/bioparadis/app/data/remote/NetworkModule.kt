package `is`.bioparadis.app.data.remote

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit

object NetworkModule {

    private const val BASE_URL = "https://bioparadis.is"

    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            })
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build()
    }

    fun provideApi(client: OkHttpClient): BioParadisApi {
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .build()
            .create(BioParadisApi::class.java)
    }
}
