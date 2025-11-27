import React from 'react';
import FAQ from ".//src/components/FAQ"; // Se corrige la ruta incluyendo la extensión .jsx

// Este es el componente de página para la ruta /faq
export default function FAQPage() {
    return (
        <div className="min-h-screen">
            {/* El componente faq maneja su propio padding y layout, se verá bien dentro del Layout principal */}
            <FAQ />
        </div>
    );
}
