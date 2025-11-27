'use client';

import React, {useState} from 'react';
import ButtonRole from '../../components/ButtonRole';

export default function RecursosPage() {
    // Estados
    const [peso, setPeso] = useState('');
    const [altura, setAltura] = useState('');
    const [edad, setEdad] = useState('');
    const [sexo, setSexo] = useState<'hombre' | 'mujer'>('hombre');
    const [nivelActividad, setNivelActividad] = useState(1.2);

    const [imc, setImc] = useState<number | null>(null);
    const [tmb, setTmb] = useState<number | null>(null);
    const [grasa, setGrasa] = useState<number | null>(null);

    const [calculadora, setCalculadora] = useState<'imc' | 'tmb' | 'grasa'>('imc');
    const [error, setError] = useState('');

    // Validación
    const validarDatos = (): boolean => {
        setError('');
        if (!peso || parseFloat(peso) <= 0) {
            setError('Ingrese un peso válido (>0).');
            return false;
        }
        if (!altura || parseFloat(altura) <= 0) {
            setError('Ingrese una altura válida (>0).');
            return false;
        }
        if ((calculadora === 'tmb' || calculadora === 'grasa') && (!edad || parseInt(edad) <= 0)) {
            setError('Ingrese una edad válida (>0).');
            return false;
        }
        return true;
    };

    // Funciones de cálculo
    const calcularIMC = () => {
        const p = parseFloat(peso);
        const a = parseFloat(altura);
        const resultado = p / (a * a);
        setImc(parseFloat(resultado.toFixed(1)));
    };

    const calcularTMB = () => {
        const p = parseFloat(peso);
        const a = parseFloat(altura) * 100;
        const e = parseInt(edad);
        const resultado =
            sexo === 'hombre'
                ? 10 * p + 6.25 * a - 5 * e + 5
                : 10 * p + 6.25 * a - 5 * e - 161;
        setTmb(Math.round(resultado * nivelActividad));
    };

    const calcularGrasa = () => {
        const p = parseFloat(peso);
        const a = parseFloat(altura) * 100;
        const e = parseInt(edad);
        const resultado =
            sexo === 'hombre'
                ? 1.20 * (p / (a / 100) ** 2) + 0.23 * e - 16.2
                : 1.20 * (p / (a / 100) ** 2) + 0.23 * e - 5.4;
        setGrasa(parseFloat(resultado.toFixed(1)));
    };

    const calcular = () => {
        if (!validarDatos()) return;
        if (calculadora === 'imc') calcularIMC();
        if (calculadora === 'tmb') calcularTMB();
        if (calculadora === 'grasa') calcularGrasa();
    };

    // Círculos y categorías IMC
    const obtenerCategoriaIMC = (valor: number) => {
        if (valor < 18.5) return {texto: 'Bajo peso', color: 'bg-blue-400'};
        if (valor < 25) return {texto: 'Normal', color: 'bg-green-400'};
        if (valor < 30) return {texto: 'Sobrepeso', color: 'bg-yellow-400'};
        return {texto: 'Obesidad', color: 'bg-red-500'};
    };

    // Inputs dinámicos según calculadora
    const renderInputs = () => {
        const inputs = [];
        inputs.push(
            <input
                key="peso"
                type="number"
                placeholder="Peso (kg)"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
        );
        inputs.push(
            <input
                key="altura"
                type="number"
                placeholder="Altura (m)"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
        );
        if (calculadora === 'tmb' || calculadora === 'grasa') {
            inputs.push(
                <input
                    key="edad"
                    type="number"
                    placeholder="Edad"
                    value={edad}
                    onChange={(e) => setEdad(e.target.value)}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                />
            );
            inputs.push(
                <select
                    key="sexo"
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value as 'hombre' | 'mujer')}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                    <option value="hombre">Hombre</option>
                    <option value="mujer">Mujer</option>
                </select>
            );
        }
        if (calculadora === 'tmb') {
            inputs.push(
                <select
                    key="actividad"
                    value={nivelActividad}
                    onChange={(e) => setNivelActividad(parseFloat(e.target.value))}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                    <option value={1.2}>Sedentario</option>
                    <option value={1.375}>Ligera actividad</option>
                    <option value={1.55}>Moderada actividad</option>
                    <option value={1.725}>Muy activa</option>
                </select>
            );
        }
        return inputs;
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
            <h1 className="text-3xl font-bold text-[#059669] mb-6 text-center">
                Calculadoras y Métricas BioLink
            </h1>

            {/* Selección de calculadora */}
            <div className="flex justify-center gap-4 mb-6">
                <ButtonRole onClick={() => setCalculadora('imc')}>IMC</ButtonRole>
                <ButtonRole onClick={() => setCalculadora('tmb')}>TMB</ButtonRole>
                <ButtonRole onClick={() => setCalculadora('grasa')}>% Grasa</ButtonRole>
            </div>

            {/* Inputs dinámicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-8 rounded-xl shadow-md">
                {renderInputs()}
            </div>

            {/* Mensaje de error */}
            {error && (
                <p className="text-red-500 font-semibold mt-2 text-center">{error}</p>
            )}

            {/* Botón de cálculo */}
            <div className="mt-4">
                <ButtonRole onClick={calcular}>Calcular</ButtonRole>
            </div>

            {/* Resultados */}
            <div className="space-y-6 mt-6">
                {imc && calculadora === 'imc' && (
                    <div className="flex items-center gap-4 p-6 bg-green-50 rounded-xl shadow-md">
                        <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold ${obtenerCategoriaIMC(imc).color}`}
                        >
                            {imc}
                        </div>
                        <p className="text-2xl font-bold text-gray-700">
                            {obtenerCategoriaIMC(imc).texto}
                        </p>
                    </div>
                )}
                {tmb && calculadora === 'tmb' && (
                    <div className="p-6 bg-green-50 rounded-xl shadow-md text-2xl font-bold text-gray-700 text-center">
                        Tu gasto calórico aproximado diario es {tmb} kcal
                    </div>
                )}
                {grasa && calculadora === 'grasa' && (
                    <div className="p-6 bg-green-50 rounded-xl shadow-md text-2xl font-bold text-gray-700 text-center">
                        Tu porcentaje de grasa corporal estimado es {grasa}%
                    </div>
                )}
            </div>
        </div>
    );
}