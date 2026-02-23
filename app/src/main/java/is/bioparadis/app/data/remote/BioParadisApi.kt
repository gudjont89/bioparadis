package `is`.bioparadis.app.data.remote

import okhttp3.ResponseBody
import retrofit2.http.GET
import retrofit2.http.Path

interface BioParadisApi {

    @GET("/")
    suspend fun getHomepage(): ResponseBody

    @GET("/mynd/{slug}/")
    suspend fun getMovieDetail(@Path("slug", encoded = true) slug: String): ResponseBody

    @GET("{path}")
    suspend fun getEventPage(@Path("path", encoded = true) path: String): ResponseBody
}
