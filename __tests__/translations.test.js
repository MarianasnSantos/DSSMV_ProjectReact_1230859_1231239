
import { translateTemperament, translateLifeSpan } from '../src/utils/translations';

describe('Sistema de Traduções', () => {

    // --- Cenário 1: Tradução Normal ---
    test('deve traduzir corretamente termos conhecidos', () => {
        const input = "Friendly, Active";
        const output = translateTemperament(input);
        expect(output).toBe("Amigável, Ativo");
    });

    // --- Cenário 2: Falta de Tradução ---
    test('deve usar o termo original (fallback) se a tradução não existir', () => {
        const termoDesconhecido = "SuperLazy";

        const output = translateTemperament(termoDesconhecido);

        expect(output).toBe("SuperLazy");
    });

    // --- Cenário 3: Mistura (Conhecido + Desconhecido) ---
    test('deve traduzir o que conhece e manter o que não conhece', () => {
        const input = "Happy, AlienDog";
        const output = translateTemperament(input);

        expect(output).toBe("Feliz, AlienDog");
    });
});