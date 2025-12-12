package com.nutri.app.viewmodel

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.nutri.app.data.model.Comida
import com.nutri.app.data.model.Plan
import com.nutri.app.data.model.Usuario // Asegúrate de tener este import
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

    // Dummy user para simular la respuesta del perfil
    private val dummyUser = Usuario(
        uid = "user123",
        nombre = "Test User",
        email = "test@test.com",
        tipo = 1 // 1 para Nutricionista, 2 para Paciente
    )

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

        // IMPORTANTE: Como el init o cargarPlanes llama a obtenerUsuario,
        // debemos dejarlo mockeado por defecto para evitar NullPointer.
        coEvery { repository.obtenerUsuario() } returns dummyUser

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

        // Mocks
        coEvery { repository.obtenerUsuario() } returns dummyUser // Simulamos que obtenemos usuario
        coEvery { repository.obtenerPlanes() } returns planesDummy

        // Ejecución
        viewModel.cargarPlanes()
        advanceUntilIdle()

        // Verificación
        assertEquals(planesDummy, viewModel.planes.value)
        assertFalse(viewModel.isLoading.value)
        assertNull(viewModel.errorMessage.value)

        // Verificamos que se haya chequeado el rol del usuario
        assertTrue(viewModel.isNutricionista.value) // Porque dummyUser.tipo es 1
    }

    @Test
    fun `cargarPlanes maneja errores y actualiza errorMessage`() = runTest {

        val mensajeError = "Error de conexión"

        // Simulamos que obtenerUsuario funciona, pero obtenerPlanes falla
        coEvery { repository.obtenerUsuario() } returns dummyUser
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

        // 1. Mock de crearPlan
        coEvery {
            repository.crearPlan(
                pacienteId = "user123", // Esperamos el ID del usuario actual si pasamos null
                nombrePlan = nombre,
                tipoPlan = tipo,
                descripcionPlan = desc,
                objetivo = obj,
                comidas = listaComidas
            )
        } just Runs

        // 2. Mock de lo que sucede DESPUÉS de crear (se recarga la lista)
        coEvery { repository.obtenerUsuario() } returns dummyUser
        coEvery { repository.obtenerPlanes() } returns emptyList()

        // Callback de éxito
        var exitoLlamado = false

        // 3. Ejecución: Pasamos null como primer argumento (pacienteIdSeleccionado)
        // para probar la lógica de fallback al currentUser
        viewModel.crearPlanCompleto(
            pacienteIdSeleccionado = null,
            nombrePlan = nombre,
            tipoPlan = tipo,
            descripcionPlan = desc,
            objetivo = obj,
            comidas = listaComidas
        ) {
            exitoLlamado = true
        }
        advanceUntilIdle()

        // Verificación
        assertTrue(exitoLlamado)
        assertFalse(viewModel.isLoading.value)
        assertNull(viewModel.errorMessage.value)

        coVerify {
            repository.crearPlan("user123", nombre, tipo, desc, obj, listaComidas)
        }
    }

    @Test
    fun `crearPlanCompleto con paciente seleccionado llama con ID correcto`() = runTest {
        val pacienteId = "paciente456"
        val nombre = "Plan Paciente"
        val tipo = "Volumen"
        val comidaDummy = Comida(nombre = "Cena", alimentos = listOf(mockk(relaxed = true)))
        val listaComidas = listOf(comidaDummy)

        // Mock de crearPlan esperando el ID específico
        coEvery {
            repository.crearPlan(
                pacienteId = pacienteId, // <--- Aquí verificamos que llegue el ID seleccionado
                nombrePlan = any(),
                tipoPlan = any(),
                descripcionPlan = any(),
                objetivo = any(),
                comidas = any()
            )
        } just Runs

        // Mocks para la recarga posterior
        coEvery { repository.obtenerUsuario() } returns dummyUser
        coEvery { repository.obtenerPlanes() } returns emptyList()

        // Ejecución pasando un ID explícito
        viewModel.crearPlanCompleto(
            pacienteIdSeleccionado = pacienteId,
            nombrePlan = nombre,
            tipoPlan = tipo,
            descripcionPlan = "",
            objetivo = "",
            comidas = listaComidas
        ) {}
        advanceUntilIdle()

        // Verificamos que se llamó con el ID del paciente, NO con el del usuario logueado
        coVerify {
            repository.crearPlan(eq(pacienteId), any(), any(), any(), any(), any())
        }
    }

    @Test
    fun `crearPlanCompleto maneja errores`() = runTest {
        val comidaDummy = Comida(nombre = "Desayuno", alimentos = listOf(mockk(relaxed = true)))
        val errorMsg = "Fallo al guardar"

        coEvery {
            repository.crearPlan(any(), any(), any(), any(), any(), any())
        } throws Exception(errorMsg)

        // Ejecución con argumentos actualizados
        viewModel.crearPlanCompleto(null, "Nombre", "Tipo", "Desc", "Obj", listOf(comidaDummy)) {}
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