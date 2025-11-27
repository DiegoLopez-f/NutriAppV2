'use client';

import ButtonRole from './ButtonRole';

export default function CardHome() {
    return (
        <div className="w-full max-w-lg bg-white p-8 md:p-12 rounded-xl shadow-md border border-green-200 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
                <span className="text-[#059669]">Nutri</span>App
            </h1>
            <p className="text-lg text-gray-700 mb-2 max-w-xs mx-auto">
                Plataforma moderna y profesional para la gestión de planes nutricionales.
            </p>
            <p className="text-md text-gray-600 mb-10 max-w-xs mx-auto">
                Personaliza tus planes y realiza un seguimiento efectivo de tu progreso diario.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <ButtonRole color="primary" onClick={() => window.location.href='/nutricionista'}>Nutricionista</ButtonRole>
                <ButtonRole color="secondary" onClick={() => window.location.href='/paciente'}>Paciente</ButtonRole>
            </div>
        </div>
    );
}