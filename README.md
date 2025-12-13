NutriAppV2 📱

NutriAppV2 es una solución integral para la gestión nutricional que conecta a Nutricionistas con sus Pacientes. La aplicación permite la creación, asignación y seguimiento de planes alimenticios personalizados, utilizando una arquitectura moderna y escalable.

/

📋 Características Principales

Para Nutricionistas 

- Gestión de Pacientes: Visualización de lista de pacientes asignados.
- Creación de Planes: Herramienta para crear planes nutricionales detallados con cálculo automático de macros (calorías, proteínas, etc.).
- Base de Datos de Alimentos: Acceso a un catálogo de alimentos para componer las comidas.
- Perfil de Usuario: Gestión de datos personales.


Para Pacientes 

- Home con dashboard visual con información sobre el plan activo.
- Visualización de Planes: Acceso inmediato a los planes de alimentación asignados.
- Detalle de Comidas: Desglose de alimentos por tiempos de comida (Desayuno, Almuerzo, Cena, etc.).
- Perfil de Usuario: Gestión de datos personales.

Aspectos Técnicos

- Autenticación Segura: Integración con Firebase Auth para login y registro.
- Persistencia de Datos: Uso de Cloud Firestore (NoSQL).
- Recursos Nativos: Integración biométrica, discado telefónico y gestión de permisos de red.

/

🏗 Arquitectura del Proyecto
El proyecto está dividido en dos grandes componentes monorepo:

1. Mobile App (Android) 
   
Desarrollada en Kotlin siguiendo el patrón de arquitectura MVVM (Model-View-ViewModel) para asegurar un código limpio, testeable y mantenible.
   - UI: Jetpack Compose.
   - Red: Retrofit + OkHttp (Consumo de API REST).
   - Asincronía: Coroutines & StateFlow.
   - Inyección de Dependencias: Manual (Service Locator pattern en Repositorios).
   - Tests: JUnit 5 & Mockk para pruebas unitarias.

2.Backend (Node.js) 

API RESTful construida con Express y TypeScript.
   - Estructura: Controladores, Rutas y Middleware de autenticación.
   - Seguridad: Middleware que verifica tokens de Firebase ID en cada petición (verifyFirebaseToken).
   - Base de Datos: Firebase Admin SDK para interactuar con Firestore.

/

🚀 Guía de Instalación y Ejecución
   
Sigue estos pasos para ejecutar el proyecto en un entorno local.

Prerrequisitos

- Android Studio Koala o superior.
- Node.js (v18+).
- Cuenta de Firebase configurada.

Paso 1: Configuración del Backend

    Navegar a la carpeta del backend:
    Bash
    cd backend
    
    Instalar las dependencias:
    Bash
    npm install
    
    
    Configuración de Firebase:
    
    Descargar archivo serviceAccountKey.json desde la consola de Firebase.
    En este caso se subirá el .json en la entrega de la evaluación, para utilizar la base de datos del proyecto.
    
    Colocar en la carpeta backend.
    
    Ejecutar el servidor:
    Bash
    npm run dev
    
    El servidor debería iniciar en http://localhost:3000.


Paso 2: Configuración de la App Móvil

    Abrir carpeta mobile en Android Studio.
    Sincronizar dependencias
    
    Configuración de IP:
    Abrir archivo mobile/app/src/main/java/com/nutri/app/data/NetworkModule.kt.
    
    Verificar la variable BASE_URL.
    Si se usa el emulador de Android oficial, debe ser: http://10.0.2.2:3000/.
    Si se usa un dispositivo físico, cambiar la IP por la IP local del pc (ej. 192.168.1.X).
    
    Ejecutar: Seleccionar emulador y presionar "Run" (▶).
/

🧪 Pruebas Unitarias

El proyecto incluye pruebas unitarias para validar la lógica de negocio en los ViewModels.

    Para ejecutar las pruebas en Android Studio:

    Navegar a app/src/test/java/com/nutri/app/viewmodel/PlanViewModelTest.kt.
    Clic derecho en el archivo o la clase y seleccionar "Run 'PlanViewModelTest'".
    
    Se verificará que la lógica de carga de planes, manejo de estados de carga (Loading) y manejo de errores funcionan correctamente.

/

👥 Autores y Colaboración

Este proyecto fue desarrollado de manera colaborativa utilizando Git Flow.

Diego López - Desarrollador Full Stack

Kevin Henríquez - Desarrollador Full Stack

Christian Pérez - Desarrollador Full Stack


Curso: Desarrollo de Soluciones Móviles (DSY1105) Fecha: Diciembre 2025