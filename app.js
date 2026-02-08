// ===== DATA STRUCTURES =====
let appState = {
    currentScreen: 'onboarding',
    categories: [
        { id: 1, name: 'Compras', emoji: '🛍️', selected: true, color: '#5856D6' },
        { id: 2, name: 'Ropa', emoji: '👔', selected: true, color: '#FF9500' },
        { id: 3, name: 'Comer afuera', emoji: '🍔', selected: true, color: '#FF2D55' },
        { id: 4, name: 'Lujo', emoji: '💎', selected: false, color: '#AF52DE' },
        { id: 5, name: 'Auto', emoji: '🚗', selected: false, color: '#00C7BE' },
        { id: 6, name: 'Mascotas', emoji: '🐶', selected: false, color: '#34C759' },
        { id: 7, name: 'Transporte', emoji: '🚌', selected: true, color: '#5856D6' },
        { id: 8, name: 'Salud', emoji: '💊', selected: false, color: '#FF9500' },
        { id: 9, name: 'Entretenimiento', emoji: '🎮', selected: false, color: '#FF2D55' }
    ],
    transactions: [],
    isListening: false,
    recognition: null,
    // Date Filtering State
    dateFilter: {
        type: 'month', // 'month', 'year', 'all'
        year: new Date().getFullYear(),
        month: new Date().getMonth() // 0-11
    }
};

// Helper to get filtered transactions
function getFilteredTransactions() {
    if (appState.dateFilter.type === 'all') {
        return appState.transactions;
    }

    return appState.transactions.filter(t => {
        const d = new Date(t.date);

        // Filter by year always if type is year or month
        if (d.getFullYear() !== appState.dateFilter.year) return false;

        // Filter by month if type is month
        if (appState.dateFilter.type === 'month') {
            return d.getMonth() === appState.dateFilter.month;
        }

        return true;
    });
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    loadFromLocalStorage();
    initializeApp();
    setupEventListeners();
    await requestMicrophonePermission();
    initializeSpeechRecognition();
});

function initializeApp() {
    renderCategories();
    updateDashboard();

    // Check if user has already completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
    if (hasCompletedOnboarding) {
        showScreen('dashboard');
    } else {
        showScreen('onboarding');
    }
}

// ===== MICROPHONE PERMISSION =====
let globalMicrophoneStream = null;
let microphonePermissionGranted = false;

async function requestMicrophonePermission() {
    // Check if permission was already granted
    if (microphonePermissionGranted && globalMicrophoneStream) {
        console.log('✅ Permiso de micrófono ya concedido');
        return true;
    }

    try {
        // Request permission ONCE and keep the stream
        globalMicrophoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphonePermissionGranted = true;
        localStorage.setItem('microphonePermissionGranted', 'true');
        console.log('✅ Permiso de micrófono concedido');
        return true;
    } catch (error) {
        console.error('❌ Error al solicitar permiso de micrófono:', error);
        if (error.name === 'NotAllowedError') {
            showMicrophonePermissionError();
        }
        microphonePermissionGranted = false;
        return false;
    }
}

function showMicrophonePermissionError() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #FF3B30;
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
        max-width: 90%;
    `;
    message.innerHTML = `
        🎤 Necesitamos acceso al micrófono<br>
        <small style="opacity: 0.9; font-size: 12px;">Por favor, permite el acceso en la configuración de tu navegador</small>
    `;
    document.body.appendChild(message);

    setTimeout(() => {
        message.style.transition = 'opacity 0.3s ease';
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 300);
    }, 5000);
}

// ===== SCREEN MANAGEMENT =====
function showScreen(screenName) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));

    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
        targetScreen.classList.add('active');
        appState.currentScreen = screenName;
    }
}

// ===== CATEGORIES MANAGEMENT =====
function renderCategories() {
    const grid = document.getElementById('categories-grid');
    grid.innerHTML = '';

    appState.categories.forEach(category => {
        const card = document.createElement('div');
        card.className = `category-card ${category.selected ? 'selected' : ''}`;
        card.innerHTML = `
            <span class="category-emoji">${category.emoji}</span>
            <div class="category-name">${category.name}</div>
        `;
        card.addEventListener('click', () => toggleCategory(category.id));
        grid.appendChild(card);
    });
}

function toggleCategory(categoryId) {
    const category = appState.categories.find(c => c.id === categoryId);
    if (category) {
        category.selected = !category.selected;
        renderCategories();
        saveToLocalStorage();
    }
}

function addNewCategory() {
    const input = document.getElementById('new-category-input');
    const name = input.value.trim();

    if (name) {
        const emojis = ['🎯', '🎨', '📚', '🏋️', '🎵', '✈️', '🏠', '💼', '🎓', '⚽'];
        const colors = ['#5856D6', '#FF9500', '#FF2D55', '#34C759', '#00C7BE', '#AF52DE'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newCategory = {
            id: Date.now(),
            name: name,
            emoji: randomEmoji,
            color: randomColor,
            selected: true
        };

        appState.categories.push(newCategory);
        renderCategories();
        input.value = '';
        saveToLocalStorage();
    }
}

// ===== SPEECH RECOGNITION =====
let microphoneStream = null;
let recognitionInitialized = false;

function initializeSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported');
        showNotification('⚠️ Tu navegador no soporta reconocimiento de voz', 'warning');
        return;
    }

    // Only initialize once
    if (recognitionInitialized && appState.recognition) {
        console.log('✅ Speech recognition ya inicializado');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    appState.recognition = new SpeechRecognition();
    appState.recognition.lang = 'es-MX';
    appState.recognition.continuous = false;
    appState.recognition.interimResults = true;
    appState.recognition.maxAlternatives = 3;

    appState.recognition.onstart = () => {
        appState.isListening = true;
        updateVoiceUI(true);
        console.log('🎤 Escuchando...');
    };

    appState.recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');

        updateTranscript(transcript);

        if (event.results[0].isFinal) {
            processVoiceInput(transcript);
        }
    };

    appState.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);

        if (event.error === 'no-speech') {
            console.log('No se detectó voz');
            showNotification('🎤 No se detectó voz, intenta de nuevo', 'info');
        } else if (event.error === 'audio-capture') {
            showNotification('❌ No se pudo acceder al micrófono', 'error');
        } else if (event.error === 'not-allowed') {
            showNotification('🎤 Por favor permite el acceso al micrófono en tu navegador', 'error');
            recognitionInitialized = false;
        } else if (event.error === 'aborted') {
            // Silently handle aborted errors
            console.log('Recognition aborted');
        }

        appState.isListening = false;
        updateVoiceUI(false);
    };

    appState.recognition.onend = () => {
        appState.isListening = false;
        updateVoiceUI(false);
        console.log('🎤 Reconocimiento finalizado');
    };

    recognitionInitialized = true;
    console.log('✅ Speech Recognition inicializado correctamente');
}

function startListening() {
    if (!appState.recognition) {
        console.log('Inicializando reconocimiento...');
        initializeSpeechRecognition();

        // Wait a bit for initialization
        setTimeout(() => {
            startListening();
        }, 100);
        return;
    }

    if (appState.isListening) {
        console.log('Ya está escuchando...');
        return;
    }

    try {
        appState.recognition.start();
        console.log('🎤 Iniciando reconocimiento...');
    } catch (error) {
        console.error('Error al iniciar reconocimiento:', error);

        if (error.name === 'InvalidStateError') {
            // Recognition is already started, stop it first
            try {
                appState.recognition.stop();
            } catch (e) {
                console.log('Could not stop recognition');
            }

            setTimeout(() => {
                try {
                    appState.recognition.start();
                } catch (e) {
                    console.error('Error on retry:', e);
                    // Reinitialize if needed
                    recognitionInitialized = false;
                    appState.recognition = null;
                    initializeSpeechRecognition();
                }
            }, 100);
        }
    }
}

function stopListening() {
    if (appState.recognition && appState.isListening) {
        try {
            appState.recognition.stop();
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
    }
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = {
        info: '#007AFF',
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30'
    };

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${colors[type] || colors.info};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
        max-width: 90%;
        animation: slideDown 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-10px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updateVoiceUI(isListening) {
    const voiceCircle = document.getElementById('voice-circle');
    const pulseRing = document.getElementById('pulse-ring');
    const voiceModalCircle = document.getElementById('voice-modal-circle');

    if (isListening) {
        voiceCircle?.classList.add('listening');
        pulseRing?.classList.add('active');
        voiceModalCircle?.classList.add('listening');
    } else {
        voiceCircle?.classList.remove('listening');
        pulseRing?.classList.remove('active');
        voiceModalCircle?.classList.remove('listening');
    }
}

function updateTranscript(text) {
    const transcriptEl = document.getElementById('voice-transcript');
    const modalTranscriptEl = document.getElementById('voice-modal-transcript');

    if (transcriptEl) {
        transcriptEl.textContent = text;
        transcriptEl.classList.add('active');
    }

    if (modalTranscriptEl) {
        modalTranscriptEl.textContent = text;
    }
}

// ===== INTELLIGENT MULTI-TRANSACTION VOICE PROCESSING =====
function processVoiceInput(transcript) {
    console.log('📝 Procesando:', transcript);

    // Detect multiple transactions in a single phrase
    const transactions = extractMultipleTransactions(transcript);

    if (transactions.length > 0) {
        // Show detected transactions in modal
        showDetectedTransactions(transactions);

        // Add all transactions
        transactions.forEach(transaction => {
            addTransaction(transaction);
        });

        // Show success notification
        const count = transactions.length;
        showNotification(`✅ ${count} transacción${count > 1 ? 'es' : ''} agregada${count > 1 ? 's' : ''}`, 'success');

        // Auto-close modal after showing results
        setTimeout(() => {
            closeVoiceModal();
        }, 3000);
    } else {
        showNotification('⚠️ No se detectaron transacciones', 'warning');
    }
}

function extractMultipleTransactions(text) {
    // 1. Detect and extract date FIRST
    const { date, cleanText } = detectDate(text);
    const lowerText = cleanText.toLowerCase();
    const transactions = [];

    console.log('🧠 Analizando texto:', cleanText);
    console.log('📅 Fecha detectada:', date.toLocaleDateString());

    // SUPER INTELLIGENT PATTERN DETECTION
    // Pattern 1: "compré X en/por $Y y Z en/por $W"
    // Pattern 2: "X $Y y Z $W"
    // Pattern 3: "X en Y pesos y Z en W pesos"

    // Advanced separators that indicate multiple items
    const itemSeparators = [
        /\s+y\s+(?:un|una|el|la|los|las)?\s*/gi,  // " y ", " y un ", " y una "
        /\s+también\s+/gi,                          // " también "
        /\s+además\s+/gi,                           // " además "
        /,\s*(?:y\s+)?/gi                          // ", " or ", y "
    ];

    // Try to detect multiple items with amounts
    let segments = [cleanText];

    // Apply each separator
    for (const separator of itemSeparators) {
        const newSegments = [];
        for (const segment of segments) {
            const parts = segment.split(separator);
            newSegments.push(...parts);
        }
        segments = newSegments;
    }

    console.log('📦 Segmentos detectados:', segments);

    // Process each segment
    for (const segment of segments) {
        const trimmedSegment = segment.trim();
        if (trimmedSegment.length < 3) continue; // Skip very short segments

        const transaction = extractSingleTransactionAdvanced(trimmedSegment, lowerText, date);
        if (transaction) {
            transactions.push(transaction);
            console.log('✅ Transacción detectada:', transaction);
        }
    }

    // If no transactions found with advanced method, try simple method
    if (transactions.length === 0) {
        const transaction = extractSingleTransaction(cleanText, lowerText, date);
        if (transaction) {
            transactions.push(transaction);
        }
    }

    console.log(`🎯 Total de transacciones detectadas: ${transactions.length}`);
    return transactions;
}

function detectDate(text) {
    let date = new Date();
    let lowerText = text.toLowerCase();
    let cleanText = text;

    console.log('📅 Date Detection Start:', lowerText);
    console.log('📅 Current Date:', date.toISOString());

    // Word to number mapping for dates
    const dateNumberWords = {
        'un': 1, 'una': 1, 'uno': 1,
        'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
        'seis': 6, 'siete': 7
    };

    // Helper regex part for numbers (digits or words)
    const numberPattern = `(\\d+|${Object.keys(dateNumberWords).join('|')})`;

    // Pattern: "hace N días"
    const daysAgoRegex = new RegExp(`hace\\s+${numberPattern}\\s+días?`, 'i');
    const daysAgoMatch = lowerText.match(daysAgoRegex);

    if (daysAgoMatch) {
        let days = parseInt(daysAgoMatch[1]);
        if (isNaN(days)) {
            days = dateNumberWords[daysAgoMatch[1]];
        }

        console.log(`📅 Detectado 'hace ${days} días'`);
        date.setDate(date.getDate() - days);
        cleanText = cleanText.replace(daysAgoMatch[0], '');
    }

    // Pattern: "hace N semanas"
    const weeksAgoRegex = new RegExp(`hace\\s+${numberPattern}\\s+semanas?`, 'i');
    const weeksAgoMatch = lowerText.match(weeksAgoRegex);

    if (weeksAgoMatch) {
        let weeks = parseInt(weeksAgoMatch[1]);
        if (isNaN(weeks)) {
            weeks = dateNumberWords[weeksAgoMatch[1]];
        }

        console.log(`📅 Detectado 'hace ${weeks} semanas'`);
        date.setDate(date.getDate() - (weeks * 7));
        cleanText = cleanText.replace(weeksAgoMatch[0], '');
    }

    // Special Keywords
    if (lowerText.includes('ayer')) {
        console.log('📅 Detectado ayer');
        date.setDate(date.getDate() - 1);
        cleanText = cleanText.replace(/\bayer\b/gi, '');
    }
    if (lowerText.includes('antier') || lowerText.includes('anteayer') || lowerText.includes('antiér')) {
        console.log('📅 Detectado antier');
        date.setDate(date.getDate() - 2);
        cleanText = cleanText.replace(/\bantier\b|\banteayer\b|\bantiér\b/gi, '');
    }

    // Day of week handling (e.g., "el lunes pasado", "el viernes")
    const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado'];
    for (let i = 0; i < daysOfWeek.length; i++) {
        const dayName = daysOfWeek[i];
        if (lowerText.includes(`el ${dayName}`)) {
            // Find the last occurrence of this day
            // 0 = Sunday, 1 = Monday...
            const targetDay = i === 4 ? 3 : (i === 8 ? 6 : i); // Handle miercoles/sabado duplicates
            const currentDay = date.getDay();
            let daysConfig = currentDay - targetDay;
            if (daysConfig <= 0) daysConfig += 7; // If today is Monday(1) and target is Tuesday(2), 1-2 = -1 + 7 = 6 days ago

            // If explicitly says "pasado" or context implies past without specific future tense
            if (lowerText.includes('pasado') || !lowerText.includes('próximo')) {
                console.log(`📅 Detectado 'el ${dayName}' (hace ${daysConfig} días)`);
                date.setDate(date.getDate() - daysConfig);
            }
            cleanText = cleanText.replace(new RegExp(`el ${dayName}(?: pasado)?`, 'gi'), '');
        }
    }

    // Clean up extra spaces/connectors left by removal
    cleanText = cleanText.replace(/\s+y\s+(?=$)/, '').trim(); // Remove trailing " y "
    cleanText = cleanText.replace(/^y\s+/, '').trim(); // Remove leading "y "

    console.log('📅 Final Date:', date.toISOString());
    console.log('📅 Clean Text:', cleanText);

    return { date, cleanText: cleanText.trim() };
}

function extractSingleTransactionAdvanced(segment, originalLowerText, dateObj = new Date()) {
    const isIncome = detectIncome(originalLowerText);
    const type = isIncome ? 'income' : 'expense';

    console.log('🔍 Analizando segmento:', segment);

    // SUPER INTELLIGENT AMOUNT EXTRACTION
    // SUPER INTELLIGENT AMOUNT EXTRACTION patterns
    // Pattern 1: "Descr en Monto" -> "Pizza en 200"
    const pattern1 = /(.+?)\s+(?:en|por|de|a)?\s*\$?\s*(\d+(?:[.,]\d+)?)\s*(?:pesos|dólares|usd|dlls|mxn)?$/i;
    // Pattern 2: "Descr Monto Moneda" -> "Pizza 200 pesos"
    const pattern2 = /(.+?)\s+(\d+(?:[.,]\d+)?)\s+(?:pesos|dólares|usd|dlls|mxn)/i;
    // Pattern 3: "Monto Moneda en Descr" -> "200 pesos en Pizza" (Ya existía similar)
    const pattern3 = /\$?\s*(\d+(?:[.,]\d+)?)\s*(?:pesos|dólares)?\s+(?:en|de|para|por)\s+(.+)/i;
    // Pattern 4: "verbo + monto + descripción" -> "Gasté 50 en un mcflurry"
    const pattern4 = /(?:gasté|pagué|compré|di)?\s*\$?\s*(\d+(?:[.,]\d+)?)\s*(?:pesos|dólares)?\s+(?:en|por|de|para)\s+(?:un|una|unos|unas|el|la|los|las)?\s*(.+)/i;
    // Pattern 5: "Descr Monto" (Fallback simple) -> "Pizza 200"
    const pattern5 = /(.+?)\s+(\d+(?:[.,]\d+)?)\s*$/i;

    let amount = 0;
    let description = '';
    let match = null;

    // Try patterns in order of specificity
    if (match = segment.match(pattern4)) {
        // "Gasté 50 en un mcflurry"
        amount = parseFloat(match[1].replace(',', '.'));
        description = match[2].trim();
        console.log('✅ Patrón detectado (Monto en Descr):', description, amount);
    } else if (match = segment.match(pattern3)) {
        // "50 pesos en Pizza"
        amount = parseFloat(match[1].replace(',', '.'));
        description = match[2].trim();
        console.log('✅ Patrón detectado (Monto Moneda Descr):', description, amount);
    } else if (match = segment.match(pattern1)) {
        // "Pizza en 200"
        description = match[1].trim();
        amount = parseFloat(match[2].replace(',', '.'));
        console.log('✅ Patrón detectado (Descr en Monto):', description, amount);
    } else if (match = segment.match(pattern2)) {
        // "Pizza 200 pesos"
        description = match[1].trim();
        amount = parseFloat(match[2].replace(',', '.'));
        console.log('✅ Patrón detectado (Descr Monto Moneda):', description, amount);
    } else if (match = segment.match(pattern5)) {
        // "Pizza 200"
        description = match[1].trim();
        amount = parseFloat(match[2].replace(',', '.'));
        console.log('✅ Patrón detectado (Descr Monto):', description, amount);
    } else {
        // Fallback using extractAmount and cleaning description
        amount = extractAmount(segment);
        // Clean description aggressively but keep product name
        description = segment
            .replace(amount.toString(), '') // Remove pure number
            .replace(/pesos|dólares|usd|dlls|mxn/gi, '') // Remove currency
            .replace(/en|por|de|a|compré|gasté|pagué|di/gi, '') // Remove connectors/verbs
            .replace(/^(un|una|el|la|los|las)\s+/i, '') // Remove articles at start
            .replace(/\s+/g, ' ') // Fix spaces
            .trim();
    }

    // Additional cleanup for "gasté" if it leaked into description
    if (description.toLowerCase().startsWith('gasté ')) {
        description = description.substring(6).trim();
    }

    if (amount <= 0) {
        console.log('❌ No se detectó monto válido');
        return null;
    }

    // Detect category based on description
    const { category, description: cleanDesc } = extractDescriptionAndCategory(description);
    // Use the clean description from category extraction only if it's not generic fallback
    if (cleanDesc && cleanDesc !== 'Transacción' && cleanDesc !== 'Compra') {
        description = cleanDesc;
    }

    // Capitalize description
    description = description.charAt(0).toUpperCase() + description.slice(1);

    console.log(`💰 Monto: $${amount}, 📝 Descripción: ${description}, 📁 Categoría: ${category?.name}`);

    return {
        id: Date.now() + Math.random(),
        type: type,
        amount: amount,
        description: description,
        category: category,
        date: dateObj.toISOString(),
        method: 'voice'
    };
}

function extractSingleTransaction(segment, originalLowerText, dateObj = new Date()) {
    const isIncome = detectIncome(originalLowerText);
    const type = isIncome ? 'income' : 'expense';

    // Extract amount
    const amount = extractAmount(segment);

    if (amount <= 0) {
        return null;
    }

    // Extract description and category
    const { description, category } = extractDescriptionAndCategory(segment);

    return {
        id: Date.now() + Math.random(), // Unique ID for multiple transactions
        type: type,
        amount: amount,
        description: description,
        category: category,
        date: dateObj.toISOString(),
        method: 'voice'
    };
}

function detectIncome(text) {
    const incomeKeywords = [
        // Verbos directos
        'gané', 'ganancia', 'ingreso', 'cobré', 'recibí',
        'me pagaron', 'me depositaron', 'me transfirieron', 'me dieron',
        'me regalaron', 'me encontré', 'me devolvieron', 'me cayó',
        'ingresó', 'entró', 'llegó',

        // Sustantivos de ingreso
        'deposito', 'salario', 'sueldo', 'bono', 'comisión',
        'premio', 'apuesta', 'venta', 'vendí', 'pago recibido',
        'transferencia recibida', 'nómina', 'quincena', 'aguinaldo',
        'propina', 'reembolso', 'devolución', 'regalo', 'préstamo recibido',
        'utilidades', 'finiquito', 'liquidación', 'beca', 'apoyo',
        'renta', 'alquiler', 'dividendo', 'intereses',
        'tanda', 'ahorro', 'alcancía', 'lotería', 'rifa',
        'dinero extra', 'lanita extra', 'domingo'
    ];

    const lowerText = text.toLowerCase();

    // Check for income keywords
    const hasIncomeKeyword = incomeKeywords.some(keyword => lowerText.includes(keyword));

    // Check for expense keywords (to avoid false positives but only if no strong income keyword found)
    // Some words like "regalo" could be ambiguous ("compré un regalo" vs "me dieron un regalo")
    // If it says "me regalaron", it's income. If it says "compré regalo", it's expense.

    if (lowerText.includes('me regalaron') || lowerText.includes('me dieron') || lowerText.includes('gané')) {
        return true;
    }

    const expenseKeywords = ['gasté', 'compré', 'pagué', 'di', 'perdí', 'costó', 'pagar', 'comprar'];
    const hasExpenseKeyword = expenseKeywords.some(keyword => lowerText.includes(keyword));

    // If has expense keyword AND no strong income indicator, assume expense
    if (hasExpenseKeyword && !hasIncomeKeyword) return false;

    // If ambiguous, check context
    if (lowerText.includes('regalo') && !lowerText.includes('me regalaron')) {
        if (lowerText.includes('compré') || lowerText.includes('para')) return false;
    }

    return hasIncomeKeyword;
}

function extractAmount(text) {
    // Advanced number words to digits with support for complex numbers
    const numberWords = {
        // Units
        'cero': 0, 'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
        'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
        'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
        'dieciséis': 16, 'dieciseis': 16, 'diecisiete': 17, 'dieciocho': 18,
        'diecinueve': 19, 'veinte': 20,
        // Tens
        'veintiuno': 21, 'veintidós': 22, 'veintidos': 22, 'veintitrés': 23, 'veintitres': 23,
        'veinticuatro': 24, 'veinticinco': 25, 'veintiséis': 26, 'veintiseis': 26,
        'veintisiete': 27, 'veintiocho': 28, 'veintinueve': 29,
        'treinta': 30, 'cuarenta': 40, 'cincuenta': 50,
        'sesenta': 60, 'setenta': 70, 'ochenta': 80, 'noventa': 90,
        // Hundreds
        'cien': 100, 'ciento': 100, 'doscientos': 200, 'doscientas': 200,
        'trescientos': 300, 'trescientas': 300, 'cuatrocientos': 400, 'cuatrocientas': 400,
        'quinientos': 500, 'quinientas': 500, 'seiscientos': 600, 'seiscientas': 600,
        'setecientos': 700, 'setecientas': 700, 'ochocientos': 800, 'ochocientas': 800,
        'novecientos': 900, 'novecientas': 900,
        // Thousands
        'mil': 1000, 'dos mil': 2000, 'tres mil': 3000, 'cuatro mil': 4000, 'cinco mil': 5000
    };

    let lowerText = text.toLowerCase();

    // Handle complex number phrases like "dos mil quinientos"
    // First, try to parse complex number phrases
    const complexNumberPattern = /((?:dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+mil)\s+((?:cien|ciento|doscientos|trescientos|cuatrocientos|quinientos|seiscientos|setecientos|ochocientos|novecientos)(?:\s+(?:y\s+)?(?:uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|veinte|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa))?)/gi;

    let match = lowerText.match(complexNumberPattern);
    if (match) {
        const parts = match[0].split(/\s+/);
        let total = 0;

        for (let i = 0; i < parts.length; i++) {
            const word = parts[i];
            if (word === 'mil') {
                const prevWord = parts[i - 1];
                const multiplier = numberWords[prevWord] || 1;
                total = multiplier * 1000;
            } else if (numberWords[word]) {
                total += numberWords[word];
            }
        }

        if (total > 0) return total;
    }

    // Replace number words with digits
    for (const [word, num] of Object.entries(numberWords)) {
        lowerText = lowerText.replace(new RegExp(`\\b${word}\\b`, 'g'), num.toString());
    }

    // Try multiple patterns to extract numbers
    const patterns = [
        // With currency symbols
        /\$\s*(\d+(?:[.,]\d+)?)/,
        /(\d+(?:[.,]\d+)?)\s*(?:pesos|dólares|usd|dlls|mxn|mx)/i,
        // Just numbers
        /(\d+(?:[.,]\d+)?)/,
        // Numbers with "de" (e.g., "500 de gasolina")
        /(\d+)\s+de\s+/i
    ];

    for (const pattern of patterns) {
        const match = lowerText.match(pattern);
        if (match) {
            let amount = parseFloat(match[1].replace(',', '.'));

            // Handle common multipliers
            if (lowerText.includes('mil') && amount < 100) {
                amount *= 1000;
            }

            return amount;
        }
    }

    return 0;
}

function extractDescriptionAndCategory(text) {
    // Super intelligent category detection with extensive keywords
    const categoryKeywords = {
        'Comer afuera': {
            keywords: [
                // Formal
                'restaurante', 'comida', 'cena', 'desayuno', 'almuerzo',
                // Comida Rápida & Antojitos (MX/LatAm)
                'hamburguesa', 'pizza', 'tacos', 'torta', 'burrito', 'sushi', 'pollo', 'carne',
                'papas', 'hot dog', 'hotdog', 'sandwich', 'quesadilla', 'enchilada',
                'chilaquiles', 'pozole', 'menudo', 'birria', 'barbacoa', 'carnitas', 'tamales',
                'elote', 'esquite', 'tostada', 'gordita', 'sope', 'huarache', 'pambazo',
                'lonche', 'cemita', 'molletes', 'sincronizada', 'gringa', 'volcanes',
                'alitas', 'wings', 'boneless', 'nuggets',
                // Jerga Popular (Slang de Comida)
                'jochos', 'dogos', 'tacubos', 'tacos de canasta', 'tacos de guisado',
                'garnacha', 'antojito', 'vitamina t', 'el bajón', 'munchies',
                'chesco', 'refresco', 'soda', 'coca', 'fresca', 'boing',
                'café', 'cafecito', 'frappé', 'malteada', 'licuado', 'jugo',
                // Postres
                'helado', 'nieve', 'paleta', 'churro', 'pan dulce', 'concha', 'dona',
                'mcflurry', 'sundae', 'blizzard', 'marquesita', 'crepa'
            ],
            emoji: '🍔'
        },
        'Compras': {
            keywords: [
                // Supermercado & Tienda
                'super', 'supermercado', 'mandado', 'despensa', 'tienda', 'abarrotes',
                'walmart', 'soriana', 'chedraui', 'aurrera', 'costco', 'sams', 'oxxo', 'seven',
                // Productos básicos
                'leche', 'huevo', 'pan', 'tortillas', 'jamón', 'queso', 'cereal',
                'fruta', 'verdura', 'carne', 'pollo', 'pescado',
                'papel', 'jabón', 'shampoo', 'pasta de dientes',
                // Jerga & Antojos de tienda
                'chuchulucos', 'botana', 'frituras', 'papas', 'sabritas', 'doritos',
                'gansito', 'pingüinos', 'chocotorro', 'galletas', 'chicles', 'dulces',
                'cigarros', 'vape', 'pod'
            ],
            emoji: '🛍️'
        },
        'Transporte': {
            keywords: [
                // Apps & Taxis
                'uber', 'didi', 'cabify', 'beat', 'taxi', 'indriver', 'viaje',
                // Transporte Público
                'metro', 'metrobús', 'camión', 'combi', 'micro', 'pesero', 'pecero',
                'ruta', 'colectivo', 'bus', 'transporte', 'pasaje', 'boleto',
                // Auto & Gasolina
                'gasolina', 'gas', 'magna', 'premium', 'diesel', 'diésel',
                'tanque lleno', 'litros', 'eché gas', 'cargar gas',
                'estacionamiento', 'parquímetro', 'pensión', 'valet', 'viene viene',
                'caseta', 'peaje', 'tag', 'pase',
                'mantenimiento', 'servicio', 'taller', 'mecánico', 'afinación', 'verificación',
                // Jerga de Auto
                'nave', 'troca', 'ranfla', 'carro', 'coche', 'auto', 'mueble'
            ],
            emoji: '🚗'
        },
        'Entretenimiento': {
            keywords: [
                // Salidas
                'cine', 'película', 'vip', 'palomitas', 'boletos',
                'concierto', 'festival', 'teatro', 'museo', 'feria',
                'boliche', 'billar', 'gotcha', 'escape room',
                // Fiesta & Alcohol (Jerga Experta)
                'fiesta', 'peda', 'pisteada', 'pisto', 'chelas', 'cheve', 'birra', 'cerveza',
                'cubas', 'tragos', 'pomos', 'botella', 'bacardí', 'bacacho', 'tequila', 'mezcal',
                'caguama', 'caguamón', 'six', 'cartón', 'michelada', 'clamato',
                'bar', 'antro', 'club', 'cantina', 'pulquería', 'terraza', 'cover',
                // Gaming & Streaming
                'videojuego', 'juego', 'skin', 'pase de batalla', 'dlc',
                'netflix', 'spotify', 'disney', 'hbo', 'prime', 'youtube', 'twitch'
            ],
            emoji: '🎮'
        },
        'Salud': {
            keywords: [
                // Médico
                'doctor', 'médico', 'consulta', 'cita', 'especialista', 'dentista', 'psicólogo',
                'simi', 'similares', 'farmacia',
                // Medicamentos
                'medicina', 'pastillas', 'jarabe', 'antibiótico', 'analgésico', 'aspirina',
                'curitas', 'vendas', 'alcohol', 'gel',
                // Jerga médica
                'el doc', 'chochos', 'remedios', 'análisis', 'sangre', 'rayos x'
            ],
            emoji: '💊'
        },
        'Ropa': {
            keywords: [
                // Prendas
                'ropa', 'camisa', 'playera', 'pantalón', 'jeans', 'vestido', 'falda',
                'zapatos', 'tenis', 'botas', 'sandalias', 'tacones',
                'ropa interior', 'calzones', 'calcetin', 'brasier',
                // Accesorios
                'bolsa', 'cartera', 'mochila', 'cinturón', 'lentes', 'reloj',
                'gorra', 'sombrero',
                // Jerga de Ropa
                'trapos', 'garras', 'pilcha', 'estrenar', 'outfit', 'looks',
                'chanclas', 'huaraches', 'zapas', 'sneakers', 'kick',
                // Marcas Lujo (implícito pero reforzado)
                'zara', 'h&m', 'shein', 'nike', 'adidas', 'puma'
            ],
            emoji: '👔'
        },
        'Lujo': {
            keywords: [
                // Alta Gama
                'lujo', 'premium', 'exclusivo', 'bienes',
                'joyas', 'oro', 'plata', 'diamante',
                'reloj fino', 'rolex', 'cartier',
                // Belleza Premium
                'spa', 'masaje', 'tratamiento', 'facial', 'botox',
                // Marcas Específicas
                'versace', 'gucci', 'louis vuitton', 'prada', 'hermes', 'chanel',
                'balenciaga', 'fendi', 'dior', 'yves saint laurent', 'ysl',
                'ferrari', 'porsche', 'mercedes', 'bmw', 'audi', 'tesla'
            ],
            emoji: '💎'
        }
    };

    let detectedCategory = null;
    let finalDescription = text; // Default to original text
    const lowerText = text.toLowerCase();
    let maxMatchScore = 0;
    let detectedKeyword = '';

    // Find matching category with priority (most specific first)
    for (const [categoryName, data] of Object.entries(categoryKeywords)) {
        for (const keyword of data.keywords) {
            if (lowerText.includes(keyword)) {
                // Calculate match score based on length (longer = more specific)
                const matchScore = keyword.length;

                // Priority boost for specific categories like Restaurants or Luxury
                let priorityMultiplier = 1;
                if (categoryName === 'Lujo') priorityMultiplier = 1.5;
                if (categoryName === 'Comer afuera') priorityMultiplier = 1.2;

                const finalScore = matchScore * priorityMultiplier;

                if (finalScore > maxMatchScore) {
                    const category = appState.categories.find(c => c.name === categoryName);
                    if (category) {
                        detectedCategory = category;
                        detectedKeyword = keyword;
                        maxMatchScore = finalScore;
                    }
                }
            }
        }
    }

    // Smart Description Logic:
    // If the original text is significantly longer than the keyword (e.g. "Bolso Versace" vs "Bolso"),
    // keep the original text to preserve detail.
    // If the original text is almost same as keyword (e.g. "hamburguesa" vs "hamburguesa"),
    // capitalize the keyword nicely.

    if (detectedCategory) {
        // Cleaning: remove "un", "una", "el" from start if consistent
        let cleanText = text.replace(/^(un|una|el|la|los|las)\s+/i, '').trim();

        // If cleanText contains the keyword and is longer, keep cleanText (Capitalized)
        if (cleanText.length > detectedKeyword.length) {
            finalDescription = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
        } else {
            // Otherwise use the keyword capitalized (normalizes spelling)
            finalDescription = detectedKeyword.charAt(0).toUpperCase() + detectedKeyword.slice(1);
        }
    } else {
        // If no category detected, try to just capitalize the input
        if (finalDescription) {
            finalDescription = finalDescription.replace(/^(un|una|el|la|los|las)\s+/i, '').trim();
            finalDescription = finalDescription.charAt(0).toUpperCase() + finalDescription.slice(1);
        }
    }

    // Fallback if empty
    if (!detectedCategory) {
        detectedCategory = appState.categories.find(c => c.selected) || appState.categories[0];
        if (!finalDescription || finalDescription.length < 3) {
            const words = text.split(' ').filter(w =>
                w.length > 3 &&
                !['gasté', 'gané', 'pesos', 'dólares', 'compré', 'pagué'].includes(w.toLowerCase())
            );
            finalDescription = words[0] ? (words[0].charAt(0).toUpperCase() + words[0].slice(1)) : 'Transacción';
        }
    }

    return {
        description: finalDescription,
        category: detectedCategory
    };
}

function showDetectedTransactions(transactions) {
    const container = document.getElementById('detected-transactions');
    if (!container) return;

    container.innerHTML = '<div style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #34C759;">✅ Transacciones detectadas:</div>';

    transactions.forEach(transaction => {
        const item = document.createElement('div');
        item.className = 'detected-transaction-item';

        const sign = transaction.type === 'income' ? '+' : '-';

        item.innerHTML = `
            <div class="detected-transaction-emoji">${transaction.category?.emoji || '💰'}</div>
            <div class="detected-transaction-info">
                <div class="detected-transaction-category">${transaction.category?.name || 'Sin categoría'}</div>
                <div class="detected-transaction-description">${transaction.description}</div>
            </div>
            <div class="detected-transaction-amount">${sign}$${transaction.amount.toFixed(2)}</div>
        `;

        container.appendChild(item);
    });
}

// ===== TRANSACTIONS MANAGEMENT =====
function addTransaction(transaction) {
    appState.transactions.unshift(transaction);
    saveToLocalStorage();
    updateDashboard();
}

function updateDashboard() {
    updateBalance();
    updateChart();
    updateCategoriesSummary();
    renderTransactionsList();
}

function updateBalance() {
    const filteredTransactions = getFilteredTransactions();

    const expenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const income = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    const balanceEl = document.getElementById('balance-amount');
    const expensesPill = document.getElementById('expenses-pill');
    const incomePill = document.getElementById('income-pill');

    if (balanceEl) {
        // Format like: -523,520$
        const absBalance = Math.abs(balance);
        const formattedBalance = new Intl.NumberFormat('en-US').format(absBalance);
        balanceEl.textContent = `${balance < 0 ? '-' : ''}${formattedBalance}$`;
        balanceEl.className = 'balance-amount';
        if (balance < 0) balanceEl.classList.add('negative');
        if (balance > 0) balanceEl.classList.add('positive');
    }

    if (expensesPill) {
        const formattedExpenses = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(expenses);
        expensesPill.textContent = `- $${formattedExpenses}`;
    }

    if (incomePill) {
        const formattedIncome = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(income);
        incomePill.textContent = `$${formattedIncome}`;
    }
}

// ===== CHART VISUALIZATION =====
function updateChart() {
    const chartContainer = document.getElementById('chart-container');
    if (!chartContainer) return;

    // Calculate totals per category
    const categoryTotals = {};
    const filteredTransactions = getFilteredTransactions();

    filteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(transaction => {
            const categoryId = transaction.category?.id;
            if (categoryId) {
                if (!categoryTotals[categoryId]) {
                    categoryTotals[categoryId] = {
                        category: transaction.category,
                        total: 0
                    };
                }
                categoryTotals[categoryId].total += transaction.amount;
            }
        });

    // Convert to array and sort by total (descending)
    const sortedCategories = Object.values(categoryTotals)
        .sort((a, b) => b.total - a.total)
        .slice(0, 4); // Show top 4 categories like in the image

    if (sortedCategories.length === 0) {
        chartContainer.innerHTML = `
            <div class="chart-empty">
                <div class="chart-empty-icon">📊</div>
                <div class="chart-empty-text">Agrega gastos para ver tu gráfica</div>
            </div>
        `;
        return;
    }

    // Find max value for scaling
    const maxValue = Math.max(...sortedCategories.map(c => c.total));

    // Render bars
    chartContainer.innerHTML = '';

    sortedCategories.forEach((item, index) => {
        const heightPercentage = (item.total / maxValue) * 100;
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${heightPercentage}%`;

        // Format amount like in the image: 222.5K, 116K, 110K, 75K
        const formattedAmount = item.total >= 1000
            ? `${(item.total / 1000).toFixed(item.total >= 10000 ? 0 : 1)}K`
            : item.total.toFixed(0);

        bar.innerHTML = `
            <div class="chart-bar-emoji">${item.category.emoji}</div>
            <div class="chart-bar-amount">${formattedAmount}</div>
        `;

        chartContainer.appendChild(bar);
    });
}

function updateCategoriesSummary() {
    const summaryContainer = document.getElementById('categories-summary');
    if (!summaryContainer) return;

    summaryContainer.innerHTML = '';

    // Calculate totals per category
    const categoryTotals = {};
    const filteredTransactions = getFilteredTransactions();

    filteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(transaction => {
            const categoryId = transaction.category?.id;
            if (categoryId) {
                if (!categoryTotals[categoryId]) {
                    categoryTotals[categoryId] = {
                        category: transaction.category,
                        total: 0
                    };
                }
                categoryTotals[categoryId].total += transaction.amount;
            }
        });

    // Sort by total (descending)
    const sortedCategories = Object.values(categoryTotals)
        .sort((a, b) => b.total - a.total);

    sortedCategories.forEach(item => {
        const card = document.createElement('div');
        card.className = 'category-summary-card';

        const formattedAmount = item.total >= 1000
            ? `${(item.total / 1000).toFixed(1)}K`
            : item.total.toFixed(0);

        card.innerHTML = `
            <div class="category-summary-emoji">${item.category.emoji}</div>
            <div class="category-summary-amount">${formattedAmount}</div>
        `;
        summaryContainer.appendChild(card);
    });
}

function renderTransactionsList() {
    const listContainer = document.getElementById('transactions-list');
    if (!listContainer) return;

    const filteredTransactions = getFilteredTransactions();

    if (filteredTransactions.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <p>No hay movimientos en este periodo</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = '';

    // Show filtered transactions (limited to recent ones for performance)
    const recentTransactions = filteredTransactions.slice(0, 50);

    recentTransactions.forEach(transaction => {
        listContainer.appendChild(createTransactionElement(transaction));
    });
}

function createTransactionElement(transaction) {
    const item = document.createElement('div');
    item.className = 'transaction-item';

    const emoji = transaction.category?.emoji || '💰';
    const amountClass = transaction.type === 'income' ? 'income' : 'expense';

    // Format amount like: $30,000.00
    const formattedAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(transaction.amount);

    item.innerHTML = `
        <div class="transaction-emoji">${emoji}</div>
        <div class="transaction-info">
            <div class="transaction-description">${transaction.description}</div>
            <div class="transaction-meta">
                ${transaction.category?.name} • ${new Date(transaction.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
            </div>
        </div>
        <div class="transaction-amount ${amountClass}">
            ${transaction.type === 'income' ? '+' : '-'} $${formattedAmount}
        </div>
    `;

    return item;
}

// ===== MANUAL TRANSACTION =====
function openManualModal() {
    const modal = document.getElementById('manual-modal');
    const categorySelect = document.getElementById('manual-category');

    categorySelect.innerHTML = '';
    appState.categories.filter(c => c.selected).forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = `${category.emoji} ${category.name}`;
        categorySelect.appendChild(option);
    });

    modal.classList.add('active');
}

function closeManualModal() {
    const modal = document.getElementById('manual-modal');
    modal.classList.remove('active');

    document.getElementById('manual-amount').value = '';
    document.getElementById('manual-description').value = '';
}

function saveManualTransaction() {
    const type = document.querySelector('.type-btn.active').dataset.type;
    const amount = parseFloat(document.getElementById('manual-amount').value);
    const description = document.getElementById('manual-description').value.trim();
    const categoryId = parseInt(document.getElementById('manual-category').value);

    if (!amount || amount <= 0) {
        alert('Por favor ingresa un monto válido');
        return;
    }

    if (!description) {
        alert('Por favor ingresa una descripción');
        return;
    }

    const category = appState.categories.find(c => c.id === categoryId);

    const transaction = {
        id: Date.now(),
        type: type,
        amount: amount,
        description: description,
        category: category,
        date: new Date().toISOString(),
        method: 'manual'
    };

    addTransaction(transaction);
    closeManualModal();
    showNotification('✅ Transacción agregada', 'success');
}

// ===== VOICE MODAL =====
function openVoiceModal() {
    const modal = document.getElementById('voice-modal');
    modal.classList.add('active');

    // Clear previous results
    document.getElementById('detected-transactions').innerHTML = '';

    setTimeout(() => {
        startListening();
    }, 500);
}

function closeVoiceModal() {
    const modal = document.getElementById('voice-modal');
    modal.classList.remove('active');
    stopListening();

    document.getElementById('voice-modal-transcript').textContent = '';
    document.getElementById('voice-modal-preview').textContent = '';
    document.getElementById('detected-transactions').innerHTML = '';
}

// ===== LOCAL STORAGE =====
function saveToLocalStorage() {
    localStorage.setItem('appState', JSON.stringify({
        categories: appState.categories,
        transactions: appState.transactions
    }));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('appState');
    if (saved) {
        const data = JSON.parse(saved);
        appState.categories = data.categories || appState.categories;
        appState.transactions = data.transactions || [];
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Onboarding
    document.getElementById('add-category-btn')?.addEventListener('click', addNewCategory);
    document.getElementById('new-category-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewCategory();
    });
    document.getElementById('save-categories-btn')?.addEventListener('click', () => {
        localStorage.setItem('hasCompletedOnboarding', 'true');
        showScreen('voice');
    });

    // Voice screen
    document.getElementById('voice-circle')?.addEventListener('click', () => {
        if (appState.isListening) {
            stopListening();
        } else {
            startListening();
        }
    });
    document.getElementById('continue-btn')?.addEventListener('click', () => {
        showScreen('dashboard');
    });
    document.getElementById('skip-voice-btn')?.addEventListener('click', () => {
        showScreen('dashboard');
    });

    // Dashboard
    document.getElementById('voice-fab')?.addEventListener('click', openVoiceModal);
    document.getElementById('add-manual-btn')?.addEventListener('click', openManualModal);

    // Manual modal
    document.getElementById('close-manual-modal')?.addEventListener('click', closeManualModal);
    document.getElementById('save-manual-transaction')?.addEventListener('click', saveManualTransaction);

    // Type selector
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Voice modal
    document.getElementById('close-voice-modal')?.addEventListener('click', closeVoiceModal);

    // Settings
    document.getElementById('settings-btn')?.addEventListener('click', openSettingsModal);
    document.getElementById('close-settings-modal')?.addEventListener('click', closeSettingsModal);

    // Settings items
    document.getElementById('edit-categories-btn')?.addEventListener('click', () => {
        closeSettingsModal();
        showScreen('onboarding');
    });

    document.getElementById('export-csv-btn')?.addEventListener('click', exportToCSV);

    document.getElementById('import-csv-btn')?.addEventListener('click', () => {
        showNotification('📥 Función de importar CSV próximamente', 'info');
    });

    // Toggles
    document.getElementById('show-income-toggle')?.addEventListener('change', (e) => {
        const showIncome = e.target.checked;
        localStorage.setItem('showIncome', showIncome);
        updateDashboard();
        showNotification(showIncome ? '✅ Mostrando ingresos' : '❌ Ocultando ingresos', 'info');
    });

    document.getElementById('cumulative-toggle')?.addEventListener('change', (e) => {
        const cumulative = e.target.checked;
        localStorage.setItem('cumulative', cumulative);
        updateDashboard();
        showNotification(cumulative ? '📊 Modo acumulado activado' : '📊 Modo mensual activado', 'info');
    });

    // Close bottom sheet on background click
    document.getElementById('settings-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'settings-modal') {
            closeSettingsModal();
        }
    });

    // Close modals on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                if (modal.id === 'voice-modal') {
                    stopListening();
                }
            }
        });
    });
}

// ===== SETTINGS MODAL =====
function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('active');
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.classList.remove('active');
}

// ===== EXPORT TO CSV =====
function exportToCSV() {
    if (appState.transactions.length === 0) {
        showNotification('⚠️ No hay transacciones para exportar', 'warning');
        return;
    }

    // Create CSV content
    let csvContent = 'Fecha,Tipo,Categoría,Descripción,Monto\n';

    appState.transactions.forEach(transaction => {
        const date = new Date(transaction.date).toLocaleDateString('es-MX');
        const type = transaction.type === 'income' ? 'Ingreso' : 'Gasto';
        const category = transaction.category?.name || 'Sin categoría';
        const description = transaction.description.replace(/,/g, ';'); // Replace commas
        const amount = transaction.amount.toFixed(2);

        csvContent += `${date},${type},${category},${description},${amount}\n`;
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `IMony_Transacciones_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('✅ CSV exportado correctamente', 'success');
    closeSettingsModal();
}

// ===== LANGUAGE SELECTOR =====
const languages = [
    { code: 'es-MX', name: 'Español', region: 'México', flag: '🇲🇽' },
    { code: 'es-ES', name: 'Español', region: 'España', flag: '🇪🇸' },
    { code: 'es-AR', name: 'Español', region: 'Argentina', flag: '🇦🇷' },
    { code: 'es-CO', name: 'Español', region: 'Colombia', flag: '🇨🇴' },
    { code: 'es-CL', name: 'Español', region: 'Chile', flag: '🇨🇱' },
    { code: 'en-US', name: 'English', region: 'United States', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English', region: 'United Kingdom', flag: '🇬🇧' },
    { code: 'en-CA', name: 'English', region: 'Canada', flag: '🇨🇦' },
    { code: 'en-AU', name: 'English', region: 'Australia', flag: '🇦🇺' },
    { code: 'en-IN', name: 'English', region: 'India', flag: '🇮🇳' },
    { code: 'fr-FR', name: 'Français', region: 'France', flag: '🇫🇷' },
    { code: 'fr-CA', name: 'Français', region: 'Canada', flag: '🇨🇦' },
    { code: 'pt-BR', name: 'Português', region: 'Brasil', flag: '🇧🇷' },
    { code: 'pt-PT', name: 'Português', region: 'Portugal', flag: '🇵🇹' },
    { code: 'de-DE', name: 'Deutsch', region: 'Deutschland', flag: '🇩🇪' },
    { code: 'it-IT', name: 'Italiano', region: 'Italia', flag: '🇮🇹' },
    { code: 'ja-JP', name: '日本語', region: '日本', flag: '🇯🇵' },
    { code: 'ko-KR', name: '한국어', region: '대한민국', flag: '🇰🇷' },
    { code: 'zh-CN', name: '中文', region: '中国', flag: '🇨🇳' },
    { code: 'zh-TW', name: '中文', region: '台灣', flag: '🇹🇼' },
    { code: 'zh-HK', name: '中文', region: '香港', flag: '🇭🇰' },
    { code: 'ru-RU', name: 'Русский', region: 'Россия', flag: '🇷🇺' },
    { code: 'ar-SA', name: 'العربية', region: 'السعودية', flag: '🇸🇦' },
    { code: 'hi-IN', name: 'हिन्दी', region: 'भारत', flag: '🇮🇳' },
    { code: 'nl-NL', name: 'Nederlands', region: 'Nederland', flag: '🇳🇱' },
    { code: 'pl-PL', name: 'Polski', region: 'Polska', flag: '🇵🇱' },
    { code: 'tr-TR', name: 'Türkçe', region: 'Türkiye', flag: '🇹🇷' },
    { code: 'sv-SE', name: 'Svenska', region: 'Sverige', flag: '🇸🇪' },
    { code: 'da-DK', name: 'Dansk', region: 'Danmark', flag: '🇩🇰' },
    { code: 'fi-FI', name: 'Suomi', region: 'Suomi', flag: '🇫🇮' },
    { code: 'no-NO', name: 'Norsk', region: 'Norge', flag: '🇳🇴' },
    { code: 'cs-CZ', name: 'Čeština', region: 'Česko', flag: '🇨🇿' },
    { code: 'el-GR', name: 'Ελληνικά', region: 'Ελλάδα', flag: '🇬🇷' },
    { code: 'he-IL', name: 'עברית', region: 'ישראל', flag: '🇮🇱' },
    { code: 'th-TH', name: 'ไทย', region: 'ประเทศไทย', flag: '🇹🇭' },
    { code: 'vi-VN', name: 'Tiếng Việt', region: 'Việt Nam', flag: '🇻🇳' },
    { code: 'id-ID', name: 'Bahasa Indonesia', region: 'Indonesia', flag: '🇮🇩' },
    { code: 'ms-MY', name: 'Bahasa Melayu', region: 'Malaysia', flag: '🇲🇾' },
    { code: 'uk-UA', name: 'Українська', region: 'Україна', flag: '🇺🇦' },
    { code: 'ro-RO', name: 'Română', region: 'România', flag: '🇷🇴' },
    { code: 'hu-HU', name: 'Magyar', region: 'Magyarország', flag: '🇭🇺' },
    { code: 'sk-SK', name: 'Slovenčina', region: 'Slovensko', flag: '🇸🇰' },
    { code: 'bg-BG', name: 'Български', region: 'България', flag: '🇧🇬' },
    { code: 'hr-HR', name: 'Hrvatski', region: 'Hrvatska', flag: '🇭🇷' },
    { code: 'sr-RS', name: 'Српски', region: 'Србија', flag: '🇷🇸' }
];

let currentLanguage = localStorage.getItem('voiceLanguage') || 'es-MX';

function renderTransactionsList_DEPRECATED() {
    const list = document.getElementById('transactions-list');
    if (!list) return;

    list.innerHTML = '';

    // Use filtered transactions
    const transactions = getFilteredTransactions();

    // Sort by date (newest first)
    const sortedTransactions = [...transactions] // Create copy
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedTransactions.length === 0) {
        list.innerHTML = '<p class="no-transactions-message">No hay transacciones para mostrar.</p>';
        return;
    }

    sortedTransactions.forEach(transaction => {
        const transactionItem = document.createElement('div');
        transactionItem.className = `transaction-item ${transaction.type}`;
        transactionItem.innerHTML = `
            <div class="transaction-icon">
                <i class="fas ${transaction.category?.icon || (transaction.type === 'income' ? 'fa-plus-circle' : 'fa-minus-circle')}"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-description">${transaction.description}</div>
                <div class="transaction-category">${transaction.category?.name || 'Sin categoría'}</div>
                <div class="transaction-date">${new Date(transaction.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</div>
            </div>
            <div class="transaction-amount">
                ${transaction.type === 'income' ? '+' : '-'} $${transaction.amount.toFixed(2)}
            </div>
            <button class="delete-transaction-btn" data-id="${transaction.id}">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        list.appendChild(transactionItem);
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-transaction-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const transactionId = e.currentTarget.dataset.id;
            deleteTransaction(transactionId);
        });
    });
}

function renderLanguageList() {
    const languageList = document.getElementById('language-list');
    if (!languageList) return;

    languageList.innerHTML = '';

    languages.forEach(lang => {
        const item = document.createElement('div');
        item.className = 'language-item';
        if (lang.code === currentLanguage) {
            item.classList.add('selected');
        }

        item.innerHTML = `
            <div class="language-flag">${lang.flag}</div>
            <div class="language-info">
                <div class="language-name">${lang.name}</div>
                <div class="language-code">${lang.region}</div>
            </div>
            ${lang.code === currentLanguage ? '<div class="language-check">✓</div>' : ''}
        `;

        item.addEventListener('click', () => {
            selectLanguage(lang.code, `${lang.name} (${lang.region})`);
        });

        languageList.appendChild(item);
    });
}

function selectLanguage(code, displayName) {
    currentLanguage = code;
    localStorage.setItem('voiceLanguage', code);

    // Update the recognition language
    if (appState.recognition) {
        appState.recognition.lang = code;
        console.log(`🌍 Idioma cambiado a: ${code}`);
    }

    // Update the label
    const label = document.getElementById('current-language-label');
    if (label) {
        label.textContent = displayName;
    }

    // Re-render the list to show the new selection
    renderLanguageList();

    // Show notification
    showNotification(`✅ Idioma cambiado a ${displayName}`, 'success');

    // Close modal after a short delay
    setTimeout(() => {
        closeLanguageModal();
    }, 500);
}

function openLanguageModal() {
    const modal = document.getElementById('language-modal');
    if (modal) {
        renderLanguageList();
        modal.classList.add('active');
    }
}

function closeLanguageModal() {
    const modal = document.getElementById('language-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Initialize language on load
document.addEventListener('DOMContentLoaded', () => {
    const savedLanguage = languages.find(l => l.code === currentLanguage);
    if (savedLanguage) {
        const label = document.getElementById('current-language-label');
        if (label) {
            label.textContent = `${savedLanguage.name} (${savedLanguage.region})`;
        }
    }

    // Language selector button
    const languageSelectorBtn = document.getElementById('language-selector-btn');
    if (languageSelectorBtn) {
        languageSelectorBtn.addEventListener('click', openLanguageModal);
    }

    // Close language modal button
    const closeLanguageBtn = document.getElementById('close-language-modal');
    if (closeLanguageBtn) {
        closeLanguageBtn.addEventListener('click', closeLanguageModal);
    }

    // Close on backdrop click
    const languageModal = document.getElementById('language-modal');
    if (languageModal) {
        languageModal.addEventListener('click', (e) => {
            if (e.target === languageModal) {
                closeLanguageModal();
            }
        });
    }

    // ===== PERIOD MODAL LISTENERS =====
    const periodBtn = document.getElementById('period-btn');
    if (periodBtn) {
        periodBtn.addEventListener('click', openPeriodModal);
    }

    const closePeriodBtn = document.getElementById('close-period-modal');
    if (closePeriodBtn) {
        closePeriodBtn.addEventListener('click', closePeriodModal);
    }

    const periodModal = document.getElementById('period-modal');
    if (periodModal) {
        periodModal.addEventListener('click', (e) => {
            if (e.target === periodModal) {
                closePeriodModal();
            }
        });
    }

    const filterAllTime = document.getElementById('filter-all-time');
    const filterYear = document.getElementById('filter-year');

    if (filterAllTime) {
        filterAllTime.addEventListener('click', () => {
            setPeriodType('all');
        });
    }
    if (filterYear) {
        filterYear.addEventListener('click', () => {
            setPeriodType('year'); // Just select year mode initially
        });
    }

    // Month buttons
    document.querySelectorAll('.month-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectMonth(parseInt(e.target.dataset.month));
        });
    });

    const applyPeriodBtn = document.getElementById('apply-period-btn');
    if (applyPeriodBtn) {
        applyPeriodBtn.addEventListener('click', applyPeriodFilter);
    }
});

// ===== PERIOD MODAL LOGIC =====
let tempDateFilter = { ...appState.dateFilter };

function openPeriodModal() {
    const modal = document.getElementById('period-modal');
    if (modal) {
        // Reset temp filter to current
        tempDateFilter = { ...appState.dateFilter };
        renderPeriodModalState();
        modal.classList.add('active');
    }
}

function closePeriodModal() {
    const modal = document.getElementById('period-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function setPeriodType(type) {
    tempDateFilter.type = type;
    renderPeriodModalState();
}

function selectMonth(monthIndex) {
    tempDateFilter.type = 'month';
    tempDateFilter.month = monthIndex;
    renderPeriodModalState();
}

function renderPeriodModalState() {
    const filterAllTime = document.getElementById('filter-all-time');
    const filterYear = document.getElementById('filter-year');

    // Update top toggles
    if (tempDateFilter.type === 'all') {
        filterAllTime.classList.add('active');
        filterYear.classList.remove('active');
    } else {
        filterAllTime.classList.remove('active');
        filterYear.classList.add('active');
    }

    // Update months grid
    document.querySelectorAll('.month-btn').forEach(btn => {
        const month = parseInt(btn.dataset.month);
        if (tempDateFilter.type === 'month' && tempDateFilter.month === month) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }

        // Disable months if in "all" or specific "year only" mode logic desired? 
        // For now just visual selection logic.
    });
}

function applyPeriodFilter() {
    console.log('🔒 Cerrando modal (inmediato)...');
    closePeriodModal();

    console.log('✅ Aplicando filtro:', tempDateFilter);
    appState.dateFilter = { ...tempDateFilter };

    // Small delay to allow modal animation to start before heavy lifting
    setTimeout(() => {
        try {
            updateDashboard(); // Re-render everything with new filter
        } catch (e) {
            console.error('Error updating dashboard:', e);
        }
    }, 100);

    // Update button text
    const periodBtn = document.getElementById('period-btn');
    if (periodBtn) {
        if (appState.dateFilter.type === 'all') {
            periodBtn.textContent = 'Todo el tiempo';
        } else if (appState.dateFilter.type === 'month') {
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            periodBtn.textContent = monthNames[appState.dateFilter.month];
        } else {
            periodBtn.textContent = appState.dateFilter.year;
        }
    }
}
