package com.nutri.app.data

import com.google.firebase.auth.FirebaseAuth
import com.nutri.app.data.model.Alimento
import com.nutri.app.data.model.Plan
import com.nutri.app.data.model.PlanPayload
import com.nutri.app.data.model.RegistroUsuarioPayload
import com.nutri.app.data.model.Usuario
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

// IP local para conectar al backend
private const val BASE_URL = "http://10.0.2.2:3000/"

// Interceptor para añadir el token a las solicitudes
class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        // Obtiene el token
        val user = FirebaseAuth.getInstance().currentUser
        val tokenTask = user?.getIdToken(false)

        val token = try {
            com.google.android.gms.tasks.Tasks.await(tokenTask!!).token
        } catch (e: Exception) {
            null // Error al obtener token
        }

        // nueva solicitud
        val newRequestBuilder = originalRequest.newBuilder()
        if (token != null) {
            newRequestBuilder.header("Authorization", "Bearer $token")
        }

        return chain.proceed(newRequestBuilder.build())
    }
}

// Endpoints
interface ApiService {
    // Alimentos
    @GET("api/alimentos")
    suspend fun getAlimentos(): List<Alimento>

    // Planes
    // Obtener planes asignados
    @GET("api/planes/asignados")
    suspend fun getMisPlanes(): List<Plan>

    // Crear nuevo plan
    @POST("api/planes")
    suspend fun crearPlan(@Body payload: PlanPayload): PlanCreadoResponse

    // Eliminar plan
    @DELETE("api/planes/{planId}")
    suspend fun eliminarPlan(@Path("planId") planId: String): MensajeResponse

    // Perfil
    // Obtener perfil de usuario
    @GET("api/perfil")
    suspend fun getMiPerfil(): Usuario

    // Actualizar perfil usuario
    @PUT("api/perfil")
    suspend fun actualizarMiPerfil(@Body updates: Map<String, @JvmSuppressWildcards Any?>): Usuario

    // REGISTRO DE USUARIO (Nuevo)
    @POST("api/usuarios")
    suspend fun registrarUsuario(@Body payload: RegistroUsuarioPayload): Usuario

    // --- NUEVO: Obtener lista de pacientes (para el nutricionista) ---
    @GET("api/usuarios")
    suspend fun getPacientes(): List<Usuario>
}

object RetrofitClient {

    // Logger
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    // Cliente OkHttp con interceptor de Auth y el Logger
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(AuthInterceptor()) // Interceptor para añadir el token
        .addInterceptor(loggingInterceptor)
        .build()

    // Constructor de Retrofit
    val api: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}

// Data classes para las respuestas de la API
data class PlanCreadoResponse(
    val id: String,
    val message: String
)

data class MensajeResponse(
    val message: String
)