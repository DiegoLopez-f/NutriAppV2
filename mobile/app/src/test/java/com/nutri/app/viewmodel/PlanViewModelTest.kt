package com.nutri.app.viewmodel

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.nutri.app.data.model.Comida
import com.nutri.app.data.model.Plan
import com.nutri.app.data.repository.PlanesRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.*

@ExperimentalCoroutinesApi
@ExtendWith(MainDispatcherExtension::class)
class PlanViewModelTest {

    private lateinit var repository: PlanesRepository
    private lateinit var viewModel: PlanViewModel

    // Mocks para Firebase
    private lateinit var firebaseAuth: FirebaseAuth
    private lateinit var firebaseUser: FirebaseUser

    @BeforeEach
    fun setUp() {
        // Mockear Log.d y Log.e para que no fallen
        mockkStatic(Log::class)
        every { Log.d(any(), any()) } returns 0
        every { Log.e(any(), any(), any()) } returns 0
        every { Log.e(any(), any()) } returns 0

        // Mockear FirebaseAuth estático
        mockkStatic(FirebaseAuth::class)
        firebaseAuth = mockk()
        firebaseUser = mockk()

        every { FirebaseAuth.getInstance() } returns firebaseAuth
        every { firebaseAuth.currentUser } returns firebaseUser
        every { firebaseUser.uid } returns "user123" // ID simulado

        repository = mockk()
        viewModel = PlanViewModel(repository)
    }

    @AfterEach
    fun tearDown() {
        unmockkAll()
    }

    @Test
    fun `cargarPlanes actualiza lista de planes cuando es exitoso`() = runTest {

        val planesDummy = listOf(
            Plan(id = "1", nombre = "Plan Keto"),
            Plan(id = "2", nombre = "Plan Vegano")
        )
        // El repositorio real no pide argumentos en obtenerPlanes()
        coEvery { repository.obtenerPlanes() } returns planesDummy


        // El ViewModel real no pide UID, lo saca de Firebase internamente (o del repo)
        viewModel.cargarPlanes()
        advanceUntilIdle()


        assertEquals(planesDummy, viewModel.planes.value)
        assertFalse(viewModel.isLoading.value)
        assertNull(viewModel.errorMessage.value)
    }

    @Test
    fun `cargarPlanes maneja errores y actualiza errorMessage`() = runTest {

        val mensajeError = "Error de conexión"
        coEvery { repository.obtenerPlanes() } throws Exception(mensajeError)


        viewModel.cargarPlanes()
        advanceUntilIdle()


        assertTrue(viewModel.planes.value.isEmpty())
        assertEquals(mensajeError, viewModel.errorMessage.value)
        assertFalse(viewModel.isLoading.value)
    }

    @Test
    fun `crearPlanCompleto llama al repositorio exitosamente`() = runTest {

        val nombre = "Plan Nuevo"
        val tipo = "Keto"
        val desc = "Descripción"
        val obj = "Bajar peso"
        val comidaDummy = Comida(nombre = "Desayuno", alimentos = listOf(mockk(relaxed = true)))
        val listaComidas = listOf(comidaDummy)

        // Mock de crearPlan
        coEvery {
            repository.crearPlan(
                pacienteId = "user123",
                nombrePlan = nombre,
                tipoPlan = tipo,
                descripcionPlan = desc,
                objetivo = obj,
                comidas = listaComidas
            )
        } just Runs

        // Mock de obtenerPlanes

        coEvery { repository.obtenerPlanes() } returns emptyList()

        // Callback de éxito
        var exitoLlamado = false


        viewModel.crearPlanCompleto(nombre, tipo, desc, obj, listaComidas) {
            exitoLlamado = true
        }
        advanceUntilIdle()


        assertTrue(exitoLlamado)
        assertFalse(viewModel.isLoading.value)
        assertNull(viewModel.errorMessage.value) // Ahora esto pasará

        coVerify {
            repository.crearPlan("user123", nombre, tipo, desc, obj, listaComidas)
        }
    }

    @Test
    fun `crearPlanCompleto maneja errores`() = runTest {
        val comidaDummy = Comida(nombre = "Desayuno", alimentos = listOf(mockk(relaxed = true)))
        val errorMsg = "Fallo al guardar"

        coEvery {
            repository.crearPlan(any(), any(), any(), any(), any(), any())
        } throws Exception(errorMsg)

        viewModel.crearPlanCompleto("Nombre", "Tipo", "Desc", "Obj", listOf(comidaDummy)) {}
        advanceUntilIdle()

        assertEquals(errorMsg, viewModel.errorMessage.value)
        assertFalse(viewModel.isLoading.value)
    }
}

// Extensión necesaria para corrutinas en tests
@ExperimentalCoroutinesApi
class MainDispatcherExtension(
    private val testDispatcher: TestDispatcher = StandardTestDispatcher()
) : BeforeEachCallback, AfterEachCallback {
    override fun beforeEach(context: ExtensionContext?) {
        Dispatchers.setMain(testDispatcher)
    }
    override fun afterEach(context: ExtensionContext?) {
        Dispatchers.resetMain()
    }
}