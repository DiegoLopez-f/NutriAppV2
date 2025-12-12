package com.nutri.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.nutri.app.data.model.Alimento
import com.nutri.app.data.model.Comida
import com.nutri.app.data.model.Plan
import com.nutri.app.data.repository.PlanesRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import android.util.Log

class PlanViewModel(private val repository: PlanesRepository = PlanesRepository()) : ViewModel() {

    // Estados para PlanScreen
    private val _planes = MutableStateFlow<List<Plan>>(emptyList())
    val planes: StateFlow<List<Plan>> = _planes

    private val _isNutricionista = MutableStateFlow(false)
    val isNutricionista: StateFlow<Boolean> = _isNutricionista

    // Estados para PlanDetalleScreen
    private val _planSeleccionado = MutableStateFlow<Plan?>(null)
    val planSeleccionado: StateFlow<Plan?> = _planSeleccionado

    // Estados para CrearPlanScreen
    private val _alimentosMaestros = MutableStateFlow<List<Alimento>>(emptyList())
    val alimentosMaestros: StateFlow<List<Alimento>> = _alimentosMaestros

    // Estados globales
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage

    fun cargarPlanes() {
        Log.d("PlanViewModel", "cargarPlanes llamado")
        viewModelScope.launch {
            _isLoading.value = true
            try {
                // 1. Primero averiguamos quién es el usuario
                val usuario = repository.obtenerUsuario()

                // Si tienes la clase RolUsuario creada en el paso anterior usa: RolUsuario.NUTRICIONISTA
                // Si no, usa directamente el 1.
                _isNutricionista.value = (usuario?.tipo == 1)

                Log.d("PlanViewModel", "Usuario tipo: ${usuario?.tipo}, esNutri: ${_isNutricionista.value}")

                // 2. Cargamos los planes
                _planes.value = repository.obtenerPlanes()
                _errorMessage.value = null

            } catch (e: Exception) {
                _errorMessage.value = e.message
                Log.e("PlanViewModel", "Error al cargar planes o usuario", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    // Cargar plan individual
    fun cargarPlanPorId(planId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            try {
                // Intentar encontrarlo en la lista
                var plan = _planes.value.find { it.id == planId }

                // Si no está, significa que _planes está vacío
                if (plan == null) {
                    Log.d("PlanViewModel", "Lista de planes vacía, cargando de nuevo...")
                    val planesList = repository.obtenerPlanes()
                    _planes.value = planesList // Guardar la lista completa

                    // Buscar en la lista recién cargada
                    plan = planesList.find { it.id == planId }
                }

                // Asignar el plan al StateFlow
                if (plan != null) {
                    _planSeleccionado.value = plan
                } else {
                    _errorMessage.value = "Plan $planId no encontrado."
                }
            } catch (e: Exception) {
                _errorMessage.value = e.message
                Log.e("PlanViewModel", "Error en cargarPlanPorId", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Limpia el plan seleccionado cuando salimos de PlanDetalleScreen
     */
    fun limpiarPlanSeleccionado() {
        _planSeleccionado.value = null
    }

    /**
     * Cargar la lista de alimentos (para CrearPlanScreen)
     */
    fun cargarAlimentos() {
        if (_alimentosMaestros.value.isNotEmpty()) return // No recargar si ya los tenemos

        viewModelScope.launch {
            _isLoading.value = true // Usamos el loading global la primera vez
            try {
                _alimentosMaestros.value = repository.obtenerAlimentos()
                _errorMessage.value = null
            } catch (e: Exception) {
                _errorMessage.value = e.message
                Log.e("PlanViewModel", "Error al cargar alimentos", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * (C)RUD - CREAR Plan (Versión COMPLEJA)
     */
    fun crearPlanCompleto(
        nombrePlan: String,
        tipoPlan: String,
        descripcionPlan: String,
        objetivo: String,
        comidas: List<Comida>,
        onExito: () -> Unit
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val pacienteId = FirebaseAuth.getInstance().currentUser?.uid
                    ?: throw Exception("Usuario no autenticado.")

                if (comidas.isEmpty() || comidas.all { it.alimentos.isEmpty() }) {
                    throw Exception("El plan debe tener al menos un alimento.")
                }

                // Llamar al repositorio con los datos completos
                repository.crearPlan(
                    pacienteId,
                    nombrePlan,
                    tipoPlan,
                    descripcionPlan,
                    objetivo,
                    comidas
                )

                _errorMessage.value = null
                Log.d("PlanViewModel", "Plan creado exitosamente")

                cargarPlanes()
                onExito()

            } catch (e: Exception) {
                _errorMessage.value = e.message
                Log.e("PlanViewModel", "Error al crear plan", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * CRU(D) - ELIMINAR Plan
     */
    fun eliminarPlan(planId: String) {
        viewModelScope.launch {
            try {
                repository.eliminarPlan(planId)
                _errorMessage.value = null
                Log.d("PlanViewModel", "Plan $planId eliminado")

                cargarPlanes()

            } catch (e: Exception) {
                _errorMessage.value = e.message
                Log.e("PlanViewModel", "Error al eliminar plan", e)
            }
        }
    }
}