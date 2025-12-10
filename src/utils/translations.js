
export const TEMPERAMENT_TRANSLATIONS = {
    // Termos básicos
    'Curious': 'Curioso',
    'Independent': 'Independente',
    'Happy': 'Feliz',
    'Intelligent': 'Inteligente',
    'Lively': 'Animado',
    'Friendly': 'Amigável',
    'Social': 'Sociável',
    'Playful': 'Brincalhão',
    'Alert': 'Alerta',
    'Brave': 'Corajoso',
    'Calm': 'Calmo',
    'Eager': 'Ansioso/Ávido',
    'Loyal': 'Leal',
    'Outgoing': 'Extrovertido',
    'Active': 'Ativo',
    'Strong': 'Forte',
    'Quiet': 'Quieto',

    // Termos adicionais
    'Stubborn': 'Teimoso',
    'Aloof': 'Reservado/Distante',
    'Loving': 'Afetuoso',
    'Strong Willed': 'Determinado',
    'Kind': 'Bondoso',
    'Tenacious': 'Tenaz',
    'Steady': 'Firme',
    'Reliable': 'Fiável',
    'Cautious': 'Cauteloso',
    'Good-natured': 'Boa-natureza',
    'Spirited': 'Cheio de Espírito',
    'Obedient': 'Obediente',
    'Affectionate': 'Carinhoso',
    'Amiable': 'Amável',
    'Self-confidence': 'Autoconfiança',
    'Fearless': 'Destemido',
    'Watchful': 'Atento',
    'Energetic': 'Energético',
    'Feisty': 'Cheio de Vigor/Atrevido',
    'Easygoing': 'Descontraído',
    'Protective': 'Protetor',
    'Devoted': 'Devoto',
    'Agile': 'Ágil',
    'Trainable': 'Treinável',
    'Hardy': 'Resistente',
    'Suspicious': 'Desconfiado',
    'Boisterous': 'Ruidoso/Exuberante',
    'Self-important': 'Auto-importante',
    'Respectful': 'Respeitoso',
    'Sweet-Tempered': 'Temperamento Doce',
    'Mischievous': 'Travesso',
    'Benevolent': 'Benévolo',
    'Clownish': 'Palhaço',
    'Keen': 'Interessado/Entusiasta',
    'Clever': 'Esperto',
    'Sociable': 'Sociável',
    'Opinionated': 'Opinioso',
    'Bold': 'Audaz',
    'Extroverted': 'Extrovertido',
    'Charming': 'Charmoso',
    'Docile': 'Dócil',
};


// --- 2. Função para Traduzir Múltiplos Temperamentos ---
export const translateTemperament = (temperamentString) => {
    if (!temperamentString) return '';

    // Divide a string em temperamentos individuais
    const temperaments = temperamentString.split(',').map(t => t.trim());

    // Traduz cada termo usando o mapa. Se não encontrar, mantém o original (t)
    const translated = temperaments.map(t => TEMPERAMENT_TRANSLATIONS[t] || t);

    // Rejunta a string
    return translated.join(', ');
};

// --- 3. Função para Traduzir o Tempo de Vida (Life Span) ---
/**
 * Traduz e formata o campo life_span para português.
 * A API retorna tipicamente "10 - 12 years"
 * @param {string} lifeSpanString - Ex: "10 - 12 years"
 * @returns {string} - Ex: "10 - 12 anos"
 */
export const translateLifeSpan = (lifeSpanString) => {
    if (!lifeSpanString) return '';

    // Substitui "years" por "anos"
    let translatedString = lifeSpanString.replace('years', 'anos').trim();

    // Se a API por vezes usar "year" (singular)
    translatedString = translatedString.replace('year', 'ano').trim();

    // Adiciona o prefixo "Vida: " que você usava no ecrã (opcional, mas útil para formatação)
    return translatedString;
};