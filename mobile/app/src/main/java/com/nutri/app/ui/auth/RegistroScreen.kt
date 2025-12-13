package com.nutri.app.ui.auth

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.launch
import com.nutri.app.data.RetrofitClient
import com.nutri.app.data.model.RegistroUsuarioPayload

@Composable
fun RegistroScreen(
    onRegistroExitoso: (String, () -> Unit) -> Unit,
    onVolverAlLogin: () -> Unit
) {
    val context = LocalContext.current
    val auth = FirebaseAuth.getInstance()
    // Necesitamos un scope para ejecutar la llamada al backend
    val scope = rememberCoroutineScope()

    var nombre by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Crear cuenta", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(20.dp))

        OutlinedTextField(
            value = nombre,
            onValueChange = { nombre = it },
            label = { Text("Nombre completo") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Correo electrónico") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Contraseña") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(20.dp))

        Button(
            onClick = {
                if (email.isBlank() || password.isBlank() || nombre.isBlank()) {
                    Toast.makeText(context, "Completa todos los campos", Toast.LENGTH_SHORT).show()
                    return@Button
                }

                isLoading = true

                // 1. Crear usuario en Firebase
                auth.createUserWithEmailAndPassword(email, password)
                    .addOnSuccessListener { result ->
                        val uid = result.user?.uid ?: return@addOnSuccessListener

                        // 2. Llamar al Backend para guardar los datos (ESTO FALTABA)
                        scope.launch {
                            try {
                                val payload = RegistroUsuarioPayload(
                                    uid = uid,
                                    email = email,
                                    nombre = nombre,
                                    tipo = 2 // Paciente
                                    // perfil_nutricional se envía por defecto con valores vacíos
                                )

                                RetrofitClient.api.registrarUsuario(payload)

                                Toast.makeText(context, "Cuenta creada exitosamente", Toast.LENGTH_SHORT).show()

                                // Navegar
                                onRegistroExitoso(uid) {
                                    isLoading = false
                                }
                            } catch (e: Exception) {
                                // Si falla el backend, mostramos error (y opcionalmente borramos el usuario de Auth)
                                Toast.makeText(context, "Error guardando datos: ${e.message}", Toast.LENGTH_LONG).show()
                                isLoading = false
                            }
                        }
                    }
                    .addOnFailureListener { e ->
                        Toast.makeText(context, "Error Firebase: ${e.message}", Toast.LENGTH_SHORT).show()
                        isLoading = false
                    }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !isLoading
        ) {
            if (isLoading)
                CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary)
            else
                Text("Registrarse")
        }

        Spacer(modifier = Modifier.height(16.dp))

        TextButton(onClick = onVolverAlLogin) {
            Text("¿Ya tienes cuenta? Inicia sesión")
        }
    }
}