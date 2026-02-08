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
});
