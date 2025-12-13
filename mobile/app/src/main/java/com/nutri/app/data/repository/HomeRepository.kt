package com.nutri.app.data.repository

import com.nutri.app.data.RetrofitClient
import com.nutri.app.data.model.Plan
import com.nutri.app.data.model.Usuario

class HomeRepository {

    private val api = RetrofitClient.api

    suspend fun obtenerUsuario(): Usuario? {
        return try {
            api.getMiPerfil()
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    // --- Función para obtener el plan más reciente ---
    suspend fun obtenerPlanActivo(): Plan? {
        return try {
            val planes = api.getMisPlanes()
            planes.firstOrNull()
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun actualizarUsuario(updates: Map<String, Any?>): Usuario? {
        return try {
            api.actualizarMiPerfil(updates)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    // Obtener lista de pacientes para el dashboard del nutricionista
    suspend fun obtenerPacientes(): List<Usuario> {
        return try {
            api.getPacientes()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
}