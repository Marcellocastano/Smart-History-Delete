document.addEventListener('DOMContentLoaded', function() {
  const MAX_FREE_KEYWORDS = 5;
  let keywords = [];

  // Elementi DOM
  const keywordInput = document.getElementById('keyword-input');
  const addKeywordButton = document.getElementById('add-keyword');
  const keywordsList = document.getElementById('keywords-list');
  const keywordsCount = document.getElementById('keywords-count');
  const deleteHistoryButton = document.getElementById('delete-history');
  // const upgradeButton = document.getElementById('upgrade-button');
  // const upgradeTitle = document.getElementById('upgrade-title');
  // const upgradeDescription = document.getElementById('upgrade-description');
  const versionLimit = document.getElementById('version-limit');

  // Inizializza le traduzioni
  function initializeTranslations() {
    keywordInput.placeholder = chrome.i18n.getMessage('keywordPlaceholder');
    addKeywordButton.textContent = chrome.i18n.getMessage('addKeyword');
    deleteHistoryButton.textContent = chrome.i18n.getMessage('deleteHistory');
    // upgradeTitle.textContent = chrome.i18n.getMessage('upgradeTitle');
    // upgradeDescription.textContent = chrome.i18n.getMessage('upgradeDescription');
    // upgradeButton.textContent = chrome.i18n.getMessage('upgradeButton');
    versionLimit.textContent = chrome.i18n.getMessage('freeVersionLimit');
    document.getElementById('support-text').textContent = chrome.i18n.getMessage('supportText');
  }

  // Carica le parole chiave salvate
  chrome.storage.local.get(['keywords'], function(result) {
    if (result.keywords) {
      keywords = result.keywords;
      updateKeywordsList();
      updateCounter();
    }
  });

  // Aggiungi parola chiave
  addKeywordButton.addEventListener('click', addKeyword);
  keywordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addKeyword();
    }
  });

  function addKeyword() {
    const keyword = keywordInput.value.trim();
    if (keyword && keywords.length < MAX_FREE_KEYWORDS) {
      if (!keywords.includes(keyword)) {
        keywords.push(keyword);
        chrome.storage.local.set({ keywords: keywords });
        updateKeywordsList();
        updateCounter();
        keywordInput.value = '';
      } else {
        alert(chrome.i18n.getMessage('keywordExistsError'));
      }
    }
    updateAddButtonState();
  }

  // Rimuovi parola chiave
  function removeKeyword(index) {
    keywords.splice(index, 1);
    chrome.storage.local.set({ keywords: keywords });
    updateKeywordsList();
    updateCounter();
    updateAddButtonState();
  }

  // Aggiorna la lista delle parole chiave
  function updateKeywordsList() {
    keywordsList.innerHTML = '';
    keywords.forEach((keyword, index) => {
      const item = document.createElement('div');
      item.className = 'keyword-item';
      item.innerHTML = `
        <span>${keyword}</span>
        <span class="remove-keyword" data-index="${index}" title="${chrome.i18n.getMessage('removeKeyword')}">×</span>
      `;
      
      // Aggiungi l'animazione di fade-in
      item.style.opacity = '0';
      item.style.transform = 'translateY(10px)';
      keywordsList.appendChild(item);
      
      // Trigger l'animazione
      setTimeout(() => {
        item.style.transition = 'all 0.3s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, 50 * index);
    });

    // Aggiungi event listener per i pulsanti di rimozione
    document.querySelectorAll('.remove-keyword').forEach(button => {
      button.addEventListener('click', function(e) {
        const index = parseInt(this.getAttribute('data-index'));
        const item = this.parentElement;
        
        // Animazione di rimozione
        item.style.transition = 'all 0.3s ease';
        item.style.opacity = '0';
        item.style.transform = 'translateY(-10px)';
        
        // Rimuovi l'elemento dopo l'animazione
        setTimeout(() => {
          removeKeyword(index);
        }, 300);
        
        e.stopPropagation();
      });
    });
  }

  // Aggiorna il contatore
  function updateCounter() {
    keywordsCount.textContent = keywords.length;
  }

  // Aggiorna lo stato del pulsante di aggiunta
  function updateAddButtonState() {
    const disabled = keywords.length >= MAX_FREE_KEYWORDS;
    addKeywordButton.disabled = disabled;
    keywordInput.disabled = disabled;
  }

  // Gestisci la cancellazione della cronologia
  deleteHistoryButton.addEventListener('click', async function() {
    if (keywords.length === 0) {
      alert(chrome.i18n.getMessage('noKeywordsError'));
      return;
    }

    const confirmed = confirm(chrome.i18n.getMessage('deleteConfirmation'));
    if (!confirmed) return;

    deleteHistoryButton.disabled = true;
    deleteHistoryButton.textContent = chrome.i18n.getMessage('deletingHistory');

    try {
      let deletedCount = 0;
      
      // Cerca nella cronologia per ogni parola chiave
      for (const keyword of keywords) {
        const results = await chrome.history.search({
          text: keyword,
          startTime: 0,
          maxResults: 100000
        });

        // Elimina ogni risultato trovato
        for (const item of results) {
          try {
            await chrome.history.deleteUrl({ url: item.url });
            deletedCount++;
          } catch (error) {
            console.error(`Errore nell'eliminazione dell'URL ${item.url}:`, error);
          }
        }
      }

      alert(chrome.i18n.getMessage('deleteSuccess', [deletedCount.toString()]));
    } catch (error) {
      console.error('Errore durante l\'eliminazione della cronologia:', error);
      alert(chrome.i18n.getMessage('deleteError'));
    } finally {
      deleteHistoryButton.disabled = false;
      deleteHistoryButton.textContent = chrome.i18n.getMessage('deleteHistory');
    }
  });

  // Gestisci l'upgrade
  // upgradeButton.addEventListener('click', function() {
  //   alert('Funzionalità Pro in arrivo! Questa funzionalità sarà disponibile presto.');
  // });

  // Inizializza le traduzioni e lo stato del pulsante di aggiunta
  initializeTranslations();
  updateAddButtonState();
});
