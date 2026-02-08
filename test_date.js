function detectDate(text) {
    let date = new Date(); // Fecha de hoy para la prueba
    let lowerText = text.toLowerCase();
    let cleanText = text;

    console.log("Original:", text);
    console.log("Fecha inicial:", date.toISOString());

    // Pattern: "hace N días"
    const daysAgoMatch = lowerText.match(/hace\s+(\d+)\s+días?/);
    if (daysAgoMatch) {
        const days = parseInt(daysAgoMatch[1]);
        date.setDate(date.getDate() - days);
        cleanText = cleanText.replace(daysAgoMatch[0], '');
        console.log(`Detectado 'hace ${days} días'. Nueva fecha:`, date.toISOString());
    }

    // Pattern: "ayer"
    if (lowerText.includes('ayer')) {
        date.setDate(date.getDate() - 1);
        cleanText = cleanText.replace(/\bayer\b/gi, '');
        console.log("Detectado 'ayer'. Nueva fecha:", date.toISOString());
    }

    console.log("Clean Text:", cleanText.trim());
    return { date, cleanText: cleanText.trim() };
}

// Pruebas
detectDate("hace 2 días compré un chocolate");
detectDate("ayer gasté 500");
