// app/plancreator/page.tsx

'use client';

import PlanCreator from '@/components/PlanCreator';
// Asegúrate de usar la ruta correcta (../../components/PlanCreator)
// o el alias (@/components/PlanCreator) si lo configuraste.

const PlanCreatorPage: React.FC = () => {
    return (
        <main>
            <PlanCreator />
        </main>
    );
};

export default PlanCreatorPage;