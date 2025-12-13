package com.nutri.app.data.repository

import com.nutri.app.data.ApiService
import com.nutri.app.data.RetrofitClient
import com.nutri.app.data.model.Alimento
import com.nutri.app.data.model.AlimentoPayload
import com.nutri.app.data.model.Comida
import com.nutri.app.data.model.ComidaPayload
import com.nutri.app.data.model.Plan
import com.nutri.app.data.model.PlanPayload
import com.nutri.app.data.model.Usuario

class PlanesRepository {

    private val api: ApiService = RetrofitClient.api

    /**
     * CRUD - LEER todos los planes del usuario logueado (desde el backend)
     */
    suspend fun obtenerPlanes(): List<Plan> {
        return try {
            api.getMisPlanes()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList() // Devuelve lista vacía en caso de error de red
        }
    }

    suspend fun obtenerUsuario(): Usuario? {
        return try {
            api.getMiPerfil()
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    suspend fun obtenerPacientes(): List<Usuario> {
        return try {
            // Reutilizamos el endpoint que ya usas en Home para ver tus pacientes
            api.getPacientes()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    /**
     * CRUD - CREAR un nuevo plan para el usuario logueado
     **/
    suspend fun crearPlan(
        pacienteId: String,
        nombrePlan: String,
        tipoPlan: String,
        descripcionPlan: String,
        objetivo: String,
        comidas: List<Comida>
    ) {

        // 1. Convertir Comida a ComidaPayload
        val comidasPayload = comidas.map { comida ->
            val alimentosPayload = comida.alimentos.map { alimento ->
                AlimentoPayload(
                    refAlimento = alimento.refAlimento,
                    cantidad = alimento.cantidad
                )
            }
            ComidaPayload(
                nombre = comida.nombre,
                alimentos = alimentosPayload
            )
        }

        // 2. Construir el Payload completo
        val payload = PlanPayload(
            pacienteId = pacienteId,
            nombre = nombrePlan,
            tipo = tipoPlan,
            descripcionPlan = descripcionPlan,
            objetivo = objetivo,
            comidas = comidasPayload
        )

        // 3. Llamar a la API
        try {
            api.crearPlan(payload)
        } catch (e: Exception) {
            e.printStackTrace()
            throw e
        }
    }

    /**
     * CRUD - ELIMINAR un plan
     */
    suspend fun eliminarPlan(planId: String) {
        try {
            api.eliminarPlan(planId)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * OBTENER todos los alimentos (para el formulario de creación)
     */
    suspend fun obtenerAlimentos(): List<Alimento> {
        return try {
            api.getAlimentos()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
}