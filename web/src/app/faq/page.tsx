"use client"; // Este componente usa estado (useState), por lo tanto, debe ser un Client Component.

import React, {useState} from "react";

// Datos de ejemplo para las preguntas frecuentes de NutriAPP
const faqData = [
    {
        id: 1,
        question: "¿Qué es NutriAPP y para quién está diseñado?",
        answer: "NutriAPP es una plataforma profesional para la gestión de planes nutricionales."
    },
    {
        id: 2,
        question: "¿Puedo personalizar mis planes de alimentación?",
        answer: "Sí, la personalización es el núcleo de NutriAPP."
    },
    {
        id: 3,
        question: "¿Cómo funciona el seguimiento del progreso?",
        answer: "Ofrecemos herramientas intuitivas de seguimiento."
    },
    {
        id: 4,
        question: "¿Necesito ser un profesional de la salud para usar NutriAPP?",
        answer: "No necesariamente. NutriAPP tiene módulos específicos."
    },
    {
        id: 5,
        question: "¿Es compatible con dispositivos móviles?",
        answer: "Absolutamente. La plataforma está construida con un enfoque totalmente responsivo."
    },
];

// Componente individual del Acordeón
const AccordionItem = ({question, answer, isOpen, onClick}) => (
    <div className="border-b border-gray-200">
        <button
            className="flex justify-between items-center w-full py-4 text-left font-semibold text-gray-900 focus:outline-none"
            onClick={onClick}
        >
            <span>{question}</span>
            <svg
                className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "transform rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        </button>

        <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
                isOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0"
            }`}
        >
            <p className="text-sm text-gray-700 leading-relaxed pr-6">{answer}</p>
        </div>
    </div>
);

// ✅ Formulario de Contacto con validación completa
const ContactForm = () => {
    // Estados para campos del formulario
    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [errores, setErrores] = useState({}); // Guardará los errores
    const [enviado, setEnviado] = useState(false); // Controla si fue enviado correctamente

    // 🔍 Función de validación completa
    const validarFormulario = () => {
        const nuevosErrores = {};

        // Validar nombre (no vacío y sin números)
        if (!nombre.trim()) {
            nuevosErrores.nombre = "El nombre es obligatorio.";
        } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) {
            nuevosErrores.nombre = "El nombre solo puede contener letras.";
        }

        // Validar correo (formato correcto)
        if (!correo.trim()) {
            nuevosErrores.correo = "El correo electrónico es obligatorio.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            nuevosErrores.correo = "El correo electrónico no es válido.";
        }

        // Validar mensaje (mínimo 10 caracteres)
        if (!mensaje.trim()) {
            nuevosErrores.mensaje = "El mensaje es obligatorio.";
        } else if (mensaje.trim().length < 10) {
            nuevosErrores.mensaje = "El mensaje debe tener al menos 10 caracteres.";
        }

        // Retornar los errores encontrados
        return nuevosErrores;
    };

    // 📤 Envío del formulario
    const handleSubmit = (e) => {
        e.preventDefault();

        const erroresDetectados = validarFormulario();
        setErrores(erroresDetectados);

        // Si no hay errores, mostrar mensaje de éxito
        if (Object.keys(erroresDetectados).length === 0) {
            setEnviado(true);
            setTimeout(() => {
                setEnviado(false);
                setNombre("");
                setCorreo("");
                setMensaje("");
            }, 3000);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-gray-50 mt-6 p-6 rounded-xl shadow-md border border-gray-200 max-w-md mx-auto transition-all duration-500"
        >
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Contáctanos
            </h3>

            {/* Campo: Nombre */}
            <label className="block text-sm font-semibold mb-1 text-gray-800">Nombre</label>
            <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={`w-full mb-1 p-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errores.nombre ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-gray-900"
                }`}
                placeholder="Tu nombre"
            />
            {errores.nombre && <p className="text-red-500 text-sm mb-2">{errores.nombre}</p>}

            {/* Campo: Correo */}
            <label className="block text-sm font-semibold mb-1 text-gray-800">Correo electrónico</label>
            <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className={`w-full mb-1 p-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errores.correo ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-gray-900"
                }`}
                placeholder="tucorreo@ejemplo.com"
            />
            {errores.correo && <p className="text-red-500 text-sm mb-2">{errores.correo}</p>}

            {/* Campo: Mensaje */}
            <label className="block text-sm font-semibold mb-1 text-gray-800">Mensaje</label>
            <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows="4"
                className={`w-full mb-1 p-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errores.mensaje ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-gray-900"
                }`}
                placeholder="Escribe tu mensaje aquí..."
            ></textarea>
            {errores.mensaje && <p className="text-red-500 text-sm mb-2">{errores.mensaje}</p>}

            {/* Botón de Envío */}
            <button
                type="submit"
                className="w-full bg-gray-900 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition duration-300"
            >
                {enviado ? "¡Mensaje enviado con éxito!" : "Enviar mensaje"}
            </button>
        </form>
    );
};

// Componente principal de Preguntas Frecuentes
export default function FAQ() {
    const [openItemId, setOpenItemId] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    const handleItemClick = (id) => setOpenItemId(openItemId === id ? null : id);
    const handleToggleForm = () => setMostrarFormulario(!mostrarFormulario);

    return (
        <div className="min-h-screen pt-16 pb-12 flex flex-col items-center p-4">
            <main className="w-full max-w-4xl space-y-12">
                {/* Encabezado */}
                <header className="text-center mb-12 border-b border-foreground/10 pb-4">
                    <h1 className="text-5xl font-bold tracking-tight mb-2 text-gray-900">Preguntas Frecuentes (FAQ)</h1>
                    <p className="text-xl text-foreground/70">Resolvemos tus dudas más comunes sobre NutriAPP.</p>
                </header>

                {/* Sección de Acordeón */}
                <section className="bg-white shadow-xl rounded-xl p-6 md:p-8 border border-gray-200">
                    {faqData.map((item) => (
                        <AccordionItem
                            key={item.id}
                            question={item.question}
                            answer={item.answer}
                            isOpen={openItemId === item.id}
                            onClick={() => handleItemClick(item.id)}
                        />
                    ))}
                </section>

                {/* Botón para mostrar formulario */}
                <footer className="text-center pt-8">
                    <p className="text-lg text-foreground/70 mb-4">¿No encuentras tu respuesta?</p>
                    <button
                        onClick={handleToggleForm}
                        className="bg-gray-900 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-gray-700 transition duration-300"
                    >
                        Contáctanos
                    </button>

                    <div
                        className={`transition-all duration-700 ease-in-out ${
                            mostrarFormulario ? "opacity-100 max-h-[800px] mt-6" : "opacity-0 max-h-0 overflow-hidden"
                        }`}
                    >
                        <ContactForm/>
                    </div>
                </footer>
            </main>
        </div>
    );
}