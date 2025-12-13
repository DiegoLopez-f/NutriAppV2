package com.nutri.app.ui.perfil

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.nutri.app.viewmodel.HomeViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PerfilScreen(
    onLogout: () -> Unit,
    viewModel: HomeViewModel = viewModel()
) {
    val usuario by viewModel.usuario.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val context = LocalContext.current

    // Estado para controlar si estamos editando o solo viendo
    var isEditing by remember { mutableStateOf(false) }

    // Estados locales para el formulario
    var nombre by remember { mutableStateOf("") }
    var peso by remember { mutableStateOf("") }
    var altura by remember { mutableStateOf("") }
    var objetivo by remember { mutableStateOf("") }

    // Cargar datos iniciales al abrir la pantalla
    LaunchedEffect(Unit) {
        viewModel.cargarDatosUsuario()
    }

    // Sincronizar los campos editables cuando llega la info del usuario
    LaunchedEffect(usuario) {
        usuario?.let { u ->
            nombre = u.nombre
            // Leemos desde perfil_nutricional
            peso = u.perfil_nutricional?.peso?.toString() ?: ""
            altura = u.perfil_nutricional?.altura?.toString() ?: ""
            objetivo = u.perfil_nutricional?.objetivo ?: ""
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mi Perfil") },
                actions = {
                    TextButton(onClick = onLogout) {
                        Text("Cerrar Sesión", color = MaterialTheme.colorScheme.error)
                    }
                }
            )
        }
    ) { padding ->
        if (isLoading && usuario == null) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Ícono de Perfil
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    modifier = Modifier.size(80.dp),
                    tint = MaterialTheme.colorScheme.primary
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Tarjeta Principal de Información
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {

                        // Encabezado de la tarjeta con botón de editar
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Información Personal",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )

                            IconButton(onClick = {
                                // Si cancelamos la edición, restauramos los valores originales
                                if (isEditing) {
                                    usuario?.let { u ->
                                        nombre = u.nombre
                                        peso = u.perfil_nutricional?.peso?.toString() ?: ""
                                        altura = u.perfil_nutricional?.altura?.toString() ?: ""
                                        objetivo = u.perfil_nutricional?.objetivo ?: ""
                                    }
                                }
                                // Cambiamos el estado de edición
                                isEditing = !isEditing
                            }) {
                                Icon(
                                    imageVector = if (isEditing) Icons.Default.Close else Icons.Default.Edit,
                                    contentDescription = if (isEditing) "Cancelar" else "Editar",
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                        }

                        Divider(modifier = Modifier.padding(vertical = 12.dp))

                        // Lógica: Alternamos entre VISTA y EDICIÓN
                        if (isEditing) {
                            // --- MODO EDICIÓN (Campos de Texto) ---
                            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                OutlinedTextField(
                                    value = nombre,
                                    onValueChange = { nombre = it },
                                    label = { Text("Nombre Completo") },
                                    modifier = Modifier.fillMaxWidth(),
                                    singleLine = true
                                )

                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    OutlinedTextField(
                                        value = peso,
                                        onValueChange = { peso = it },
                                        label = { Text("Peso (kg)") },
                                        modifier = Modifier.weight(1f),
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                        singleLine = true
                                    )
                                    OutlinedTextField(
                                        value = altura,
                                        onValueChange = { altura = it },
                                        label = { Text("Altura (cm)") },
                                        modifier = Modifier.weight(1f),
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                        singleLine = true
                                    )
                                }

                                OutlinedTextField(
                                    value = objetivo,
                                    onValueChange = { objetivo = it },
                                    label = { Text("Objetivo") },
                                    modifier = Modifier.fillMaxWidth(),
                                    singleLine = true
                                )
                            }
                        } else {
                            // --- MODO LECTURA (Texto limpio) ---
                            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                DatoItem(titulo = "Nombre", valor = usuario?.nombre ?: "Sin nombre")

                                Row(modifier = Modifier.fillMaxWidth()) {
                                    Box(modifier = Modifier.weight(1f)) {
                                        DatoItem(titulo = "Peso", valor = "${usuario?.perfil_nutricional?.peso ?: "-"} kg")
                                    }
                                    Box(modifier = Modifier.weight(1f)) {
                                        DatoItem(titulo = "Altura", valor = "${usuario?.perfil_nutricional?.altura ?: "-"} cm")
                                    }
                                }

                                DatoItem(titulo = "Objetivo", valor = usuario?.perfil_nutricional?.objetivo ?: "Sin definir")

                                DatoItem(titulo = "Email", valor = usuario?.email ?: "")
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Botón Guardar (Solo aparece al editar)
                if (isEditing) {
                    Button(
                        onClick = {
                            viewModel.actualizarDatosUsuario(
                                nombre = nombre,
                                peso = peso.toDoubleOrNull(),
                                altura = altura.toDoubleOrNull(),
                                objetivo = objetivo,
                                onExito = {
                                    isEditing = false
                                    Toast.makeText(context, "Perfil actualizado", Toast.LENGTH_SHORT).show()
                                }
                            )
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        enabled = !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                        } else {
                            Icon(Icons.Default.Save, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Guardar Cambios")
                        }
                    }
                }

                // ==========================================
                //       SECCIÓN CENTRO DE AYUDA
                // ==========================================
                Spacer(modifier = Modifier.height(32.dp))

                Text(
                    text = "Centro de Ayuda",
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.align(Alignment.Start)
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Llamada a la función del teléfono
                TarjetaContacto(
                    nombre = "Soporte NutriApp",
                    numero = "+56912345678" // <--- Aquí editas el número real
                )

                Spacer(modifier = Modifier.height(32.dp)) // Espacio final extra para scroll
            }
        }
    }
}

// Componente auxiliar para mostrar los datos
@Composable
fun DatoItem(titulo: String, valor: String) {
    Column {
        Text(
            text = titulo,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = if (valor.isBlank()) "-" else valor,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurface,
            fontWeight = FontWeight.Medium
        )
    }
}

// Componente auxiliar para la tarjeta de llamada
@Composable
fun TarjetaContacto(nombre: String, numero: String) {
    val context = LocalContext.current

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable {
                val intent = Intent(Intent.ACTION_DIAL).apply {
                    data = Uri.parse("tel:$numero")
                }
                context.startActivity(intent)
            },
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Phone,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(32.dp)
            )
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(text = nombre, style = MaterialTheme.typography.titleMedium)
                Text(
                    text = numero,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}