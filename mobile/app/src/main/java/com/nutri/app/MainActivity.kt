package com.nutri.app

import android.os.Bundle
import android.widget.Toast
import androidx.activity.compose.setContent
import androidx.biometric.BiometricPrompt
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity // IMPORTANTE: Cambiado de ComponentActivity
import com.google.firebase.auth.FirebaseAuth
import com.nutri.app.ui.MainAppScreen
import com.nutri.app.ui.auth.LoginScreen
import com.nutri.app.ui.auth.RegistroScreen
import com.nutri.app.ui.theme.NutriAppTheme

// IMPORTANTE: Heredar de FragmentActivity para usar BiometricPrompt
class MainActivity : FragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val auth = FirebaseAuth.getInstance()

        setContent {
            NutriAppTheme {
                // Estado que controla qué pantalla "macro" se muestra
                var currentScreen by remember { mutableStateOf("login") }

                val context = LocalContext.current

                // Función auxiliar para lanzar el prompt biométrico
                fun lanzarBiometrico() {
                    val executor = ContextCompat.getMainExecutor(context)

                    val biometricPrompt = BiometricPrompt(this, executor,
                        object : BiometricPrompt.AuthenticationCallback() {
                            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                                super.onAuthenticationSucceeded(result)
                                // Si la huella es correcta, pasamos a la App
                                currentScreen = "app"
                                Toast.makeText(context, "Autenticación exitosa", Toast.LENGTH_SHORT).show()
                            }

                            override fun onAuthenticationFailed() {
                                super.onAuthenticationFailed()
                                Toast.makeText(context, "Huella no reconocida", Toast.LENGTH_SHORT).show()
                            }

                            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                                super.onAuthenticationError(errorCode, errString)
                                // Si el usuario cancela o hay error, podrías forzar logout o mostrar mensaje
                                Toast.makeText(context, "Error de autenticación: $errString", Toast.LENGTH_SHORT).show()
                                // Opcional: Si cancela, lo dejamos en el login
                                // auth.signOut()
                            }
                        })

                    val promptInfo = BiometricPrompt.PromptInfo.Builder()
                        .setTitle("Autenticación Biométrica")
                        .setSubtitle("Ingresa con tu huella para continuar")
                        .setNegativeButtonText("Cancelar") // Botón obligatorio
                        .build()

                    biometricPrompt.authenticate(promptInfo)
                }

                // Verificamos al iniciar si ya existe un usuario logueado
                LaunchedEffect(Unit) {
                    if (auth.currentUser != null) {
                        // EN LUGAR DE ENTRAR DIRECTO, PEDIMOS HUELLA
                        lanzarBiometrico()
                    }
                }

                when (currentScreen) {
                    "login" -> {
                        LoginScreen(
                            onLoginExitoso = {
                                // Al loguearse manualmente (usuario/pass), entramos directo
                                currentScreen = "app"
                            },
                            onIrARegistro = {
                                currentScreen = "registro"
                            }
                        )
                    }
                    "registro" -> {
                        RegistroScreen(
                            onRegistroExitoso = { uid, onComplete ->
                                // Al registrarse con éxito, pasamos directo a la app
                                currentScreen = "app"
                                onComplete()
                            },
                            onVolverAlLogin = {
                                currentScreen = "login"
                            }
                        )
                    }
                    "app" -> {
                        // Aquí cargamos la estructura principal con la barra de navegación
                        MainAppScreen(
                            onLogout = {
                                auth.signOut()
                                currentScreen = "login"
                            }
                        )
                    }
                }
            }
        }
    }
}