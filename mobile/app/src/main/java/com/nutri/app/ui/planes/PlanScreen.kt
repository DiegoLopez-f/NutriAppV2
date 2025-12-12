package com.nutri.app.ui.planes

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.nutri.app.ui.components.PlanCard
import com.nutri.app.viewmodel.PlanViewModel
@ExperimentalMaterial3Api
@Composable
fun PlanScreen(
    viewModel: PlanViewModel = viewModel(),
    navController: NavController
) {
    val planes by viewModel.planes.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    val isNutricionista by viewModel.isNutricionista.collectAsState()


    LaunchedEffect(Unit) {
        viewModel.cargarPlanes()
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Mis Planes") }) },
        floatingActionButton = {
            // **CONDICIÓN 1: Solo mostrar FAB si es Nutricionista**
            if (isNutricionista) {
                FloatingActionButton(onClick = {
                    navController.navigate("crearPlan")
                }) {
                    Icon(Icons.Default.Add, contentDescription = "Crear Plan")
                }
            }
        }
    ) { padding ->
        when {
            isLoading -> Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) { CircularProgressIndicator() }

            errorMessage != null -> Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) { Text("Error: $errorMessage") }

            planes.isEmpty() -> Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) { Text("No tienes planes asignados.") }

            else -> LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(planes) { plan ->
                    Box {
                        PlanCard(plan) {
                            navController.navigate("planDetalle/${plan.id}")
                        }
                        // Botón de eliminar
                        if (isNutricionista) {
                            IconButton(
                                onClick = { viewModel.eliminarPlan(plan.id) },
                                modifier = Modifier.align(Alignment.TopEnd)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = "Eliminar", tint = MaterialTheme.colorScheme.error)
                            }
                        }
                    }
                }
            }
        }
    }
}