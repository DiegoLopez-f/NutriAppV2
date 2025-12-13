package com.nutri.app.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.nutri.app.ui.home.HomeScreen
import com.nutri.app.ui.planes.CrearPlanScreen
import com.nutri.app.ui.planes.PlanDetalleScreen
import com.nutri.app.ui.planes.PlanScreen
import com.nutri.app.ui.perfil.PerfilScreen

// rutas principales
sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Home : Screen("home", "Inicio", Icons.Filled.Home)
    object Planes : Screen("planes", "Planes", Icons.Filled.DateRange)
    object Perfil : Screen("perfil", "Perfil", Icons.Filled.Person)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScreen(
    onLogout: () -> Unit
) {
    val navController = rememberNavController()

    // Lista de pantallas para la barra inferior
    val items = listOf(
        Screen.Home,
        Screen.Planes,
        Screen.Perfil
    )

    Scaffold(
        bottomBar = {
            // Solo mostramos la barra en las pantallas principales
            val navBackStackEntry by navController.currentBackStackEntryAsState()
            val currentRoute = navBackStackEntry?.destination?.route
            val esRutaPrincipal = items.any { it.route == currentRoute }

            if (esRutaPrincipal) {
                NavigationBar {
                    items.forEach { screen ->
                        NavigationBarItem(
                            icon = { Icon(screen.icon, contentDescription = screen.title) },
                            label = { Text(screen.title) },
                            selected = currentRoute == screen.route,
                            onClick = {
                                navController.navigate(screen.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            // --- PANTALLAS PRINCIPALES ---

            composable(Screen.Home.route) {
                HomeScreen(
                    onLogout = onLogout,
                    onVerPlanes = {
                        // Navegar a la pestaña de planes
                        navController.navigate(Screen.Planes.route)
                    }
                )
            }

            composable(Screen.Planes.route) {
                PlanScreen(
                    navController = navController // Pasamos el controller
                )
            }

            composable(Screen.Perfil.route) {
                PerfilScreen(
                    onLogout = onLogout
                )
            }

            // --- PANTALLAS SECUNDARIAS ---

            composable("crearPlan") {
                CrearPlanScreen(navController = navController)
            }

            composable(
                route = "planDetalle/{planId}",
                arguments = listOf(navArgument("planId") { type = NavType.StringType })
            ) { backStackEntry ->
                val planId = backStackEntry.arguments?.getString("planId") ?: return@composable
                PlanDetalleScreen(
                    planId = planId,
                    navController = navController
                )
            }
        }
    }
}