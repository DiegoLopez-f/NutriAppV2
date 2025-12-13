package com.nutri.app.ui.planes

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.nutri.app.data.model.Alimento
import com.nutri.app.data.model.AlimentoPlan
import com.nutri.app.data.model.Comida
import com.nutri.app.data.model.Usuario
import com.nutri.app.viewmodel.PlanViewModel

val NOMBRES_COMIDAS = listOf("Desayuno", "Colacion", "Almuerzo", "Cena")
val OPCIONES_UNIDAD = listOf("g", "ml", "unidad")

data class FormularioAlimentoState(
    val comidaSeleccionada: String = NOMBRES_COMIDAS[0],
    val alimentoSeleccionado: Alimento? = null,
    val cantidad: String = "100",
    val unidad: String = OPCIONES_UNIDAD[0]
)

data class PlanEnConstruccion(
    val nombre: String = "",
    val descripcion: String = "",
    val objetivo: String = "",
    val tipo: String = "Volumen",
    val comidas: Map<String, List<AlimentoPlan>> = NOMBRES_COMIDAS.associateWith { emptyList() }
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CrearPlanScreen(
    navController: NavController,
    viewModel: PlanViewModel = viewModel()
) {
    // Estados Contexto y ViewModel
    val context = LocalContext.current
    val isLoading by viewModel.isLoading.collectAsState()
    val alimentosMaestros by viewModel.alimentosMaestros.collectAsState()

    // Estado Pacientes (Ya no observamos isNutricionista porque asumimos que LO ES)
    val listaPacientes by viewModel.pacientes.collectAsState()

    // Estados Locales del Formulario
    var planState by remember { mutableStateOf(PlanEnConstruccion()) }
    var formAlimentoState by remember { mutableStateOf(FormularioAlimentoState()) }

    // Estado para el Paciente Seleccionado
    var pacienteSeleccionado by remember { mutableStateOf<Usuario?>(null) }
    var expandedPacientes by remember { mutableStateOf(false) }

    // Carga inicial incondicional
    LaunchedEffect(Unit) {
        viewModel.cargarAlimentos()
        viewModel.cargarPacientes() // Se carga siempre
    }

    // Logica de Guardado simplificada
    fun onGuardarPlan() {
        if (planState.nombre.isBlank()) {
            Toast.makeText(context, "El plan debe tener un nombre", Toast.LENGTH_SHORT).show()
            return
        }

        // Validación OBLIGATORIA: Debe haber un paciente seleccionado
        if (pacienteSeleccionado == null) {
            Toast.makeText(context, "Debes seleccionar un paciente para asignar el plan", Toast.LENGTH_SHORT).show()
            return
        }

        val comidasParaEnviar: List<Comida> = planState.comidas
            .filter { it.value.isNotEmpty() }
            .map { (nombre, alimentos) ->
                Comida(
                    nombre = nombre,
                    descripcion = "",
                    alimentos = alimentos,
                    macros = emptyMap()
                )
            }

        if (comidasParaEnviar.isEmpty()) {
            Toast.makeText(context, "El plan debe tener al menos un alimento", Toast.LENGTH_SHORT).show()
            return
        }

        // Llamada al ViewModel
        viewModel.crearPlanCompleto(
            pacienteIdSeleccionado = pacienteSeleccionado?.uid,
            nombrePlan = planState.nombre,
            tipoPlan = planState.tipo,
            descripcionPlan = planState.descripcion,
            objetivo = planState.objetivo,
            comidas = comidasParaEnviar,
            onExito = {
                navController.popBackStack()
            }
        )
    }

    fun onAñadirAlimento() {
        val alimento = formAlimentoState.alimentoSeleccionado
        val cantidadNum = formAlimentoState.cantidad.toDoubleOrNull()

        if (alimento == null) {
            Toast.makeText(context, "Selecciona un alimento", Toast.LENGTH_SHORT).show()
            return
        }
        if (cantidadNum == null || cantidadNum <= 0) {
            Toast.makeText(context, "Ingresa una cantidad válida", Toast.LENGTH_SHORT).show()
            return
        }
        val nuevoAlimentoPlan = AlimentoPlan(
            refAlimento = alimento.id,
            cantidad = "${formAlimentoState.cantidad} ${formAlimentoState.unidad}"
        )
        val comidaActual = formAlimentoState.comidaSeleccionada
        planState = planState.copy(
            comidas = planState.comidas + (comidaActual to (planState.comidas[comidaActual]!! + nuevoAlimentoPlan))
        )
        formAlimentoState = formAlimentoState.copy(alimentoSeleccionado = null, cantidad = "100", unidad = OPCIONES_UNIDAD[0])
    }

    // UI
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Crear Nuevo Plan") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, "Volver")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Datos del plan
            item {
                Card(modifier = Modifier.fillMaxWidth().padding(top = 16.dp)) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(text = "Datos Generales", style = MaterialTheme.typography.titleLarge)
                        Spacer(modifier = Modifier.height(16.dp))

                        // ================== SELECTOR DE PACIENTE (SIEMPRE VISIBLE) ==================
                        ExposedDropdownMenuBox(
                            expanded = expandedPacientes,
                            onExpandedChange = { expandedPacientes = !expandedPacientes }
                        ) {
                            OutlinedTextField(
                                value = pacienteSeleccionado?.nombre ?: "Seleccionar Paciente",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Asignar a Paciente") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedPacientes) },
                                colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                                modifier = Modifier.fillMaxWidth().menuAnchor()
                            )

                            ExposedDropdownMenu(
                                expanded = expandedPacientes,
                                onDismissRequest = { expandedPacientes = false }
                            ) {
                                if (listaPacientes.isEmpty()) {
                                    DropdownMenuItem(
                                        text = { Text("No hay pacientes disponibles") },
                                        onClick = { expandedPacientes = false },
                                        enabled = false
                                    )
                                }
                                listaPacientes.forEach { paciente ->
                                    DropdownMenuItem(
                                        text = { Text(text = paciente.nombre) },
                                        onClick = {
                                            pacienteSeleccionado = paciente
                                            expandedPacientes = false
                                        }
                                    )
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        // ==============================================================================

                        // Nombre
                        OutlinedTextField(
                            value = planState.nombre,
                            onValueChange = { planState = planState.copy(nombre = it) },
                            label = { Text("Nombre del Plan") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        // Descripción
                        OutlinedTextField(
                            value = planState.descripcion,
                            onValueChange = { planState = planState.copy(descripcion = it) },
                            label = { Text("Descripción del Plan") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        // Objetivo
                        OutlinedTextField(
                            value = planState.objetivo,
                            onValueChange = { planState = planState.copy(objetivo = it) },
                            label = { Text("Objetivo") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done)
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        Text("Tipo de Plan", style = MaterialTheme.typography.titleMedium)
                        Spacer(modifier = Modifier.height(8.dp))
                        SelectorTipoPlan(
                            tipoSeleccionado = planState.tipo,
                            onSelect = { planState = planState.copy(tipo = it) }
                        )
                    }
                }
            }

            // Añadir alimentos
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    FormularioAñadirAlimento(
                        state = formAlimentoState,
                        alimentosMaestros = alimentosMaestros,
                        onStateChange = { formAlimentoState = it },
                        onAñadir = { onAñadirAlimento() },
                        isLoading = isLoading
                    )
                }
            }

            // Lista plan en construcción
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Resumen del Plan",
                            style = MaterialTheme.typography.headlineSmall,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )
                        NOMBRES_COMIDAS.forEach { nombreComida ->
                            val alimentosEnComida = planState.comidas[nombreComida]!!

                            Text(
                                text = "$nombreComida (${alimentosEnComida.size})",
                                style = MaterialTheme.typography.titleMedium,
                                modifier = Modifier.padding(top = 8.dp)
                            )
                            Divider(modifier = Modifier.padding(bottom = 8.dp))

                            if (alimentosEnComida.isEmpty()) {
                                Text("Sin alimentos", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            } else {
                                alimentosEnComida.forEach { alimentoPlan ->
                                    val nombreAlimento = alimentosMaestros.find { it.id == alimentoPlan.refAlimento }?.nombre ?: "Alimento desconocido"
                                    AlimentoItem(
                                        nombre = nombreAlimento,
                                        cantidad = alimentoPlan.cantidad,
                                        onEliminar = {
                                            planState = planState.copy(
                                                comidas = planState.comidas + (nombreComida to alimentosEnComida.filter { it != alimentoPlan })
                                            )
                                        }
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                    }
                }
            }

            // Botón para guardar
            item {
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = { onGuardarPlan() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    enabled = !isLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                        Text("Guardar Plan Completo")
                    }
                }
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

// ... (Los componentes AlimentoItem, FormularioAñadirAlimento y SelectorTipoPlan quedan igual)
@Composable
fun AlimentoItem(nombre: String, cantidad: String, onEliminar: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f), shape = MaterialTheme.shapes.small)
            .padding(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = "$nombre ($cantidad)", modifier = Modifier.weight(1f))
        IconButton(onClick = onEliminar, modifier = Modifier.size(32.dp)) {
            Icon(Icons.Default.Close, "Eliminar", tint = MaterialTheme.colorScheme.error)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FormularioAñadirAlimento(
    state: FormularioAlimentoState,
    alimentosMaestros: List<Alimento>,
    onStateChange: (FormularioAlimentoState) -> Unit,
    onAñadir: () -> Unit,
    isLoading: Boolean
) {
    var expandedComida by remember { mutableStateOf(false) }
    var expandedAlimento by remember { mutableStateOf(false) }
    var expandedUnidad by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
        Text("Añadir Alimento", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(16.dp))

        // Selector de Comida
        ExposedDropdownMenuBox(
            expanded = expandedComida,
            onExpandedChange = { expandedComida = it }
        ) {
            OutlinedTextField(
                value = state.comidaSeleccionada,
                onValueChange = {},
                readOnly = true,
                label = { Text("Comida") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedComida) },
                modifier = Modifier.menuAnchor().fillMaxWidth()
            )
            ExposedDropdownMenu(expanded = expandedComida, onDismissRequest = { expandedComida = false }) {
                NOMBRES_COMIDAS.forEach { nombre ->
                    DropdownMenuItem(text = { Text(nombre) }, onClick = {
                        onStateChange(state.copy(comidaSeleccionada = nombre))
                        expandedComida = false
                    })
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Selector de Alimento
        ExposedDropdownMenuBox(
            expanded = expandedAlimento,
            onExpandedChange = { expandedAlimento = it }
        ) {
            OutlinedTextField(
                value = state.alimentoSeleccionado?.nombre ?: "",
                onValueChange = {},
                readOnly = true,
                label = { Text("Alimento") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedAlimento) },
                modifier = Modifier.menuAnchor().fillMaxWidth()
            )
            ExposedDropdownMenu(expanded = expandedAlimento, onDismissRequest = { expandedAlimento = false }) {
                if (alimentosMaestros.isEmpty()) {
                    DropdownMenuItem(text = { Text(if (isLoading) "Cargando alimentos..." else "No hay alimentos") }, onClick = {}, enabled = false)
                }
                alimentosMaestros.forEach { alimento ->
                    DropdownMenuItem(text = { Text(alimento.nombre) }, onClick = {
                        onStateChange(state.copy(alimentoSeleccionado = alimento))
                        expandedAlimento = false
                    })
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Cantidad y Unidad
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = state.cantidad,
                onValueChange = { newValue ->
                    if (newValue.length <= 4 && (newValue.isEmpty() || newValue.all { it.isDigit() })) {
                        onStateChange(state.copy(cantidad = newValue))
                    }
                },
                label = { Text("Cantidad") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
                modifier = Modifier.weight(1.8f)
            )

            // Selector de Unidad
            ExposedDropdownMenuBox(
                expanded = expandedUnidad,
                onExpandedChange = { expandedUnidad = it },
                modifier = Modifier.weight(1f)
            ) {
                OutlinedTextField(
                    value = state.unidad,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Unidad") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedUnidad) },
                    modifier = Modifier.menuAnchor().fillMaxWidth()
                )
                ExposedDropdownMenu(expanded = expandedUnidad, onDismissRequest = { expandedUnidad = false }) {
                    OPCIONES_UNIDAD.forEach { unidad ->
                        DropdownMenuItem(text = { Text(unidad) }, onClick = {
                            onStateChange(state.copy(unidad = unidad))
                            expandedUnidad = false
                        })
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Button(onClick = onAñadir, modifier = Modifier.fillMaxWidth()) {
            Icon(Icons.Default.Add, "Añadir")
            Spacer(modifier = Modifier.width(4.dp))
            Text("Añadir al plan")
        }
    }
}

@Composable
fun SelectorTipoPlan(tipoSeleccionado: String, onSelect: (String) -> Unit) {
    val opciones = listOf("Volumen", "Recomposición", "Deficit")
    LazyRow(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally)
    ) {
        items(opciones) { opcion ->
            Box(
                modifier = Modifier
                    .border(
                        1.dp,
                        if (opcion == tipoSeleccionado) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
                        MaterialTheme.shapes.small
                    )
                    .background(
                        if (opcion == tipoSeleccionado) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface,
                        MaterialTheme.shapes.small
                    )
                    .clickable { onSelect(opcion) }
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Text(opcion, color = if (opcion == tipoSeleccionado) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface)
            }
        }
    }
}