import { api } from '../lib/api';
import { auth } from '../lib/firebase';

global.fetch = jest.fn() as jest.Mock;

jest.mock('../lib/firebase', () => {
    return {
        auth: {
            currentUser: {
                getIdToken: jest.fn(),
            }
        }
    };
});

const mockedFetch = global.fetch as jest.Mock;
// @ts-ignore
const mockedGetToken = auth.currentUser.getIdToken as jest.Mock;

// ----------------------------------------------------------------------
// 2. SUITE DE PRUEBAS
// ----------------------------------------------------------------------

describe('Cliente API (api.ts)', () => {

    beforeEach(() => {
        mockedFetch.mockClear();
        mockedGetToken.mockClear();
        mockedGetToken.mockResolvedValue('token-simulado-abc-123');
    });

    it('getPerfil: debería incluir el token de autorización', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ nombre: 'Diego' })
        });

        await api.getPerfil();

        expect(mockedFetch).toHaveBeenCalledWith(
            expect.stringContaining('/perfil'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer token-simulado-abc-123'
                })
            })
        );
    });

    it('registrarUsuario: debería enviar el payload correcto', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Usuario creado' })
        });

        const usuario = { uid: '123', email: 'test@test.com' };
        await api.registrarUsuario(usuario);

        expect(mockedFetch).toHaveBeenCalledWith(
            expect.stringContaining('/usuarios'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(usuario)
            })
        );
    });

    it('getAllPlanes: debería consultar el endpoint de nutricionista', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        await api.getAllPlanes();

        expect(mockedFetch).toHaveBeenCalledWith(
            expect.stringContaining('/nutricionista/todos-los-planes'),
            expect.any(Object)
        );
    });


    it('getFarmacias: debería intentar conectar con el servicio', async () => {
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [{ local_nombre: "Farmacia Test" }]
        });

        await api.getFarmacias();

        // Verificamos que llame al endpoint configurado en api.ts
        expect(mockedFetch).toHaveBeenCalledWith(
            expect.stringContaining('/farmacias'),
            expect.any(Object)
        );
    });
});