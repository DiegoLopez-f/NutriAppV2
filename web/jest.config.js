/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require('next/jest')

const createJestConfig = nextJest({
    // Ruta a tu app Next.js para cargar next.config.js y .env
    dir: './',
})

// Configuración personalizada de Jest
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        // Mapeo de alias para imports absolutos (@/...)
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    // Opcional: si usas cobertura
    coverageProvider: 'v8',
}

// createJestConfig exporta una función asíncrona necesaria para Next.js
module.exports = createJestConfig(customJestConfig)