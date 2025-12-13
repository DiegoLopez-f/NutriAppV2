package com.nutri.app.viewmodel

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nutri.app.data.model.Plan
import com.nutri.app.data.model.Usuario
import com.nutri.app.data.repository.HomeRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class HomeViewModel(private val repository: HomeRepository = HomeRepository()) : ViewModel() {

    private val _usuario = MutableStateFlow<Usuario?>(null)
    val usuario: StateFlow<Usuario?> = _usuario

    // Estado Plan Activo (Solo para Pacientes)
    private val _planActivo = MutableStateFlow<Plan?>(null)
    val planActivo: StateFlow<Plan?> = _planActivo

    // ---  Estado Lista de Pacientes (Solo para Nutricionista) ---
    private val _pacientes = MutableStateFlow<List<Usuario>>(emptyList())
    val pacientes: StateFlow<List<Usuario>> = _pacientes

    // ---  Estado para el Buscador ---
    private val _busqueda = MutableStateFlow("")
    val busqueda: StateFlow<String> = _busqueda

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage

    fun cargarDatosUsuario() {
        Log.d("HomeViewModel", "cargarDatosUsuario llamado")
        viewModelScope.launch {
            _isLoading.value = true
            try {
                // Cargar Usuario
                val user = repository.obtenerUsuario()
                _usuario.value = user

                // Lógica según el Rol
                if (user != null) {
                    if (user.tipo == 1) {
                        // --- ES NUTRICIONISTA: Cargar lista de pacientes ---
                        Log.d("HomeViewModel", "Usuario es Nutricionista, cargando pacientes...")
                        _pacientes.value = repository.obtenerPacientes()
                    } else {
                        // --- ES PACIENTE: Cargar su plan activo ---
                        Log.d("HomeViewModel", "Usuario es Paciente, cargando plan...")
                        _planActivo.value = repository.obtenerPlanActivo()
                    }
                }

                _errorMessage.value = null
            } catch (e: Exception) {
                _errorMessage.value = e.message
                Log.e("HomeViewModel", "Error al cargar datos", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    // ---  Función para actualizar el texto de búsqueda ---
    fun setBusqueda(query: String) {
        _busqueda.value = query
    }

    fun actualizarDatosUsuario(
        nombre: String? = null,
        peso: Double?,
        altura: Double?,
        objetivo: String?,
        onExito: () -> Unit
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val updates = mutableMapOf<String, Any?>()

                if (nombre != null) {
                    updates["nombre"] = nombre
                }

                val perfilUpdates = mutableMapOf<String, Any?>()
                if (peso != null) perfilUpdates["peso"] = peso
                if (altura != null) perfilUpdates["altura"] = altura
                if (objetivo != null) perfilUpdates["objetivo"] = objetivo

                if (perfilUpdates.isNotEmpty()) {
                    updates["perfil_nutricional"] = perfilUpdates
                }

                val usuarioActualizado = repository.actualizarUsuario(updates)

                if (usuarioActualizado != null) {
                    _usuario.value = usuarioActualizado
                }

                _errorMessage.value = null
                onExito()

            } catch (e: Exception) {
                _errorMessage.value = "Error: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
}