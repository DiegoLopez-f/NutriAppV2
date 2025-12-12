package com.nutri.app.ui.home

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.CopyAll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nutri.app.data.model.Usuario

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardNutricionista(
    usuario: Usuario,
    pacientes: List<Usuario>,
    busqueda: String,
    onBusquedaChange: (String) -> Unit,
    onVerDetallePaciente: (String) -> Unit
) {
    val context = LocalContext.current

    // Filtramos la lista según lo que se escriba en el buscador
    val pacientesFiltrados = pacientes.filter {
        it.nombre.contains(busqueda, ignoreCase = true) ||
                it.email.contains(busqueda, ignoreCase = true)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(24.dp))

        // 1. Encabezado
        Text(
            text = "Panel Nutricionista",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = "Gestiona tus pacientes",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(24.dp))

        // 2. KPIs (Tarjetas de Estadísticas)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            KpiCard(
                titulo = "Total Pacientes",
                valor = pacientes.size.toString(),
                modifier = Modifier.weight(1f),
                color = MaterialTheme.colorScheme.primaryContainer,
                onColor = MaterialTheme.colorScheme.onPrimaryContainer
            )
            // Calculamos cuántos tienen un objetivo definido (Plan Activo)
            val activos = pacientes.count { !it.perfil_nutricional?.objetivo.isNullOrBlank() }
            KpiCard(
                titulo = "Con Plan Activo",
                valor = activos.toString(),
                modifier = Modifier.weight(1f),
                color = MaterialTheme.colorScheme.secondaryContainer,
                onColor = MaterialTheme.colorScheme.onSecondaryContainer
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // 3. Buscador
        OutlinedTextField(
            value = busqueda,
            onValueChange = onBusquedaChange,
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Buscar por nombre o email...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            shape = RoundedCornerShape(12.dp),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(16.dp))

        // 4. Lista de Pacientes
        if (pacientesFiltrados.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No se encontraron pacientes", color = Color.Gray)
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                // Dejamos espacio abajo para que no lo tape la barra de navegación
                contentPadding = PaddingValues(bottom = 80.dp)
            ) {
                items(pacientesFiltrados) { paciente ->
                    PacienteItemCard(
                        paciente = paciente,
                        onCopyId = {
                            // Lógica para copiar al portapapeles
                            val clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                            val clip = android.content.ClipData.newPlainText("ID Paciente", paciente.uid)
                            clipboard.setPrimaryClip(clip)
                            Toast.makeText(context, "ID copiado: ${paciente.nombre}", Toast.LENGTH_SHORT).show()
                        },
                        onClick = { onVerDetallePaciente(paciente.uid) }
                    )
                }
            }
        }
    }
}

@Composable
fun KpiCard(titulo: String, valor: String, modifier: Modifier = Modifier, color: Color, onColor: Color) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = color)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = valor,
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                color = onColor
            )
            Text(
                text = titulo,
                style = MaterialTheme.typography.labelMedium,
                color = onColor.copy(alpha = 0.8f)
            )
        }
    }
}

@Composable
fun PacienteItemCard(paciente: Usuario, onCopyId: () -> Unit, onClick: () -> Unit) {
    val tienePlan = !paciente.perfil_nutricional?.objetivo.isNullOrBlank()

    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar Circular con la inicial
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(if(tienePlan) MaterialTheme.colorScheme.primary else Color.Gray),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = paciente.nombre.firstOrNull()?.toString()?.uppercase() ?: "?",
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            // Información del Paciente
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = paciente.nombre,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = paciente.email,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )
                if (tienePlan) {
                    Text(
                        text = "Objetivo: ${paciente.perfil_nutricional?.objetivo}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                } else {
                    Text(
                        text = "Sin plan asignado",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.Gray
                    )
                }
            }

            // Botón Copiar ID
            IconButton(onClick = onCopyId) {
                Icon(
                    Icons.Outlined.CopyAll,
                    contentDescription = "Copiar ID",
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}