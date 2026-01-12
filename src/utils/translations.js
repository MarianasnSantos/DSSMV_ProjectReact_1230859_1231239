
export const TEMPERAMENT_TRANSLATIONS = {
    // Termos básicos
    'Curious': 'Curioso',
    'Independent': 'Independente',
    'Happy': 'Feliz',
    'Intelligent': 'Inteligente',
    'Lively': 'Cheio de vida',
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
    'Even Tempered': 'Temperamento equilibrado',
    'Excitable': 'Entusiasmado',
    'Determined': 'Determinado',

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
    'Dignified': 'Digno',
    'Adventurous': 'Aventureiro',
    'Fun-loving': 'Divertido',
    'Silly': 'Bobo/Pateta',
    'Composed': 'Composto',
    'Docile': 'Dócil',
    'Wild': 'Selvagem',
    'Confident': 'Confiante',
    'Courageous': 'Corajoso',
    'Responsive': 'Recetivo',
    'Receptive': 'Recetivo',
    'Faithful': 'Fiel',
    'Dutiful': 'Diligente',
    'Responsible': 'Responsável',
    'Gentle': 'Gentil',
    'Assertive': 'Assertivo',
    'Dominant': 'Dominante',
    'Reserved': 'Reservado',
    'Attentive': 'Atento',
    'Proud': 'Orgulhoso',
    'Self-assured': 'Auto-confiante',
    'Trusting' : 'Confiável'
};


export const translateTemperament = (temperamentString) => {
    if (!temperamentString) return '';
    const temperaments = temperamentString.split(',').map(t => t.trim());
    const translated = temperaments.map(t => TEMPERAMENT_TRANSLATIONS[t] || t);
    return translated.join(', ');
};

export const translateLifeSpan = (lifeSpanString) => {
    if (!lifeSpanString) return '';

    let translatedString = lifeSpanString.replace('years', 'anos').trim();
    translatedString = translatedString.replace('year', 'ano').trim();

    return translatedString;
};