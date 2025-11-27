export default function PrivacidadPage() {
    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md">
            <h1 className="text-3xl font-bold text-[#059669] mb-6">Privacidad</h1>
            <p className="mb-4">
                En BioLink, valoramos tu privacidad y nos comprometemos a proteger tus datos personales.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Recopilamos datos necesarios para ofrecer nuestros servicios de nutrición.</li>
                <li>No compartimos tu información con terceros sin tu consentimiento.</li>
                <li>Puedes solicitar la eliminación de tus datos en cualquier momento.</li>
                <li>Usamos medidas de seguridad para proteger tus datos.</li>
            </ul>
            <p className="mt-6 text-gray-600">
                Para consultas sobre privacidad, contáctanos a nutriapp@nutricion.com.
            </p>
        </div>
    );
}