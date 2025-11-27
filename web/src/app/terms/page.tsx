// app/terms/page.tsx
export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md">
            <h1 className="text-3xl font-bold text-[#059669] mb-6">Términos de Uso</h1>
            <p className="mb-4">
                Bienvenido a BioLink. Al utilizar nuestro sitio web, aceptas cumplir con los siguientes términos y
                condiciones:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>El uso de nuestra plataforma es bajo tu propia responsabilidad.</li>
                <li>No se permite la difusión de información falsa o dañina.</li>
                <li>BioLink se reserva el derecho de modificar los contenidos y servicios.</li>
                <li>El acceso a ciertas secciones puede requerir autenticación.</li>
            </ul>
            <p className="mt-6 text-gray-600">
                Estos términos se aplican a todos los usuarios de BioLink. Para más información, contáctanos.
            </p>
        </div>
    );
}
