import { MMKV } from 'react-native-mmkv';
import uuid from 'react-native-uuid';


// Initialize MMKV storage
const storage = new MMKV();

// Dynamically import vocabulary packs using require.context
const vocabPackContext = require.context('../vocabPacks', true, /\.js$/);
export const loadVocabularyPacks = () => {
    const vocabPacks = vocabPackContext.keys().map(path => {
        const vocabPackModule = vocabPackContext(path);
        const { languagePair, name, flag, icon, description, length, cards } = vocabPackModule;

        const key = `${languagePair.replace(' ', '_').toLowerCase()}-${name.toLowerCase()}`;
        
        console.log(languagePair, name, flag, icon, description, length, cards);
        console.log('key is: ', key);

        // Process each card to add win/loss/winrate properties
        cards.forEach(card => {
            card.id = card.id || uuid.v4(); // Generate a UUID for the card
            card.wins = card.wins || 0;  // Initialize wins if not already set
            card.losses = card.losses || 0;  // Initialize losses if not already set
            card.winrate = parseFloat((card.losses > 0 ? (card.wins / card.losses * 100).toFixed(2) : 0).toString());  // Calculate winrate, handling division by zero
        });

        // JSON stringify with numerical winrate
        const writingData = JSON.stringify({
            languagePair, name, flag, icon, description, length, cards
        });
        console.log('writingData', writingData);

        storage.set(key, writingData);

        return {
            languagePair, name, flag, icon, description, length, cards
        };
    }).filter(pack => pack !== null); // Filter out any null entries

    console.log("Loaded Vocabulary Packs:", vocabPacks.length);
};

loadVocabularyPacks();


export const getVocabPack = (languagePair, packName) => {
    const key = `${languagePair.replace(' ', '_').toLowerCase()}-${packName.toLowerCase()}`;
    const pack = storage.getString(key);
    return pack ? JSON.parse(pack) : [];
};

export const getCards = (languagePair, packName) => {
    const vocabPack = getVocabPack(languagePair, packName)
    if (vocabPack) { 
        console.log(" (getCards) if (vocabPack) {  == true", vocabPack, 'CARDS',vocabPack.cards )
        return vocabPack.cards;
    }
    console.log("getCards = (languagePair, packName) =>  empty!!!! ")
    return []
};

export const getCard = (languagePair, packName, cardId) => {
    // Fetch cards using languagePair and packName
    const cards = getCards(languagePair, packName);
    console.log('(getCard) cards:', cards, 'languagePair, packName, cardId:', languagePair, packName, cardId);

    // Check if 'cards' is indeed an array before trying to filter
    if (!Array.isArray(cards)) {
        console.error('Expected "cards" to be an array but received:', typeof cards);
        return null;  // Return null or throw an error as appropriate
    }

    // Find and return the card with the matching 'cardId'
    const card = cards.filter(c => c.id === cardId)[0];
    if (!card) {
        console.log('No card found with id:', cardId);
    }
    return card;
};


export const addCard = (languagePair, packName, card) => {
    const vocabPack = getVocabPack(languagePair, packName); // Fetch the entire pack
    if (!vocabPack.cards) vocabPack.cards = []; // Ensure cards array exists
    card.id = uuid.v4(); // Generate a UUID for the card
    vocabPack.cards.push(card);
    const key = `${languagePair.replace(' ', '_').toLowerCase()}-${packName.toLowerCase()}`;
    storage.set(key, JSON.stringify(vocabPack)); // Save the entire pack back to storage
};


export const deleteCard = (languagePair, packName, cardId) => {
    const vocabPack = getVocabPack(languagePair, packName);
    vocabPack.cards = vocabPack.cards.filter(card => card.id !== cardId);
    const key = `${languagePair.replace(' ', '_').toLowerCase()}-${packName.toLowerCase()}`;
    storage.set(key, JSON.stringify(vocabPack));
};


export const updateCard = (languagePair, packName, cardId, updates) => {
    const key = `${languagePair.replace(' ', '_').toLowerCase()}-${packName.toLowerCase()}`;
    // Fetch the entire vocabulary pack
    const vocabPack = getVocabPack(languagePair, packName);
    
    if (!vocabPack || !vocabPack.cards) {
        console.error('Vocabulary pack not found or has no cards');
        return;
    }

    // Find the index of the card to update
    const cardIndex = vocabPack.cards.findIndex(card => card.id === cardId);
    
    if (cardIndex !== -1) {
        // Handle specific updates for wins and losses, and recalculate winrate if necessary
        if (updates.wins !== undefined || updates.losses !== undefined) {
            vocabPack.cards[cardIndex].wins = updates.wins ?? vocabPack.cards[cardIndex].wins;
            vocabPack.cards[cardIndex].losses = updates.losses ?? vocabPack.cards[cardIndex].losses;
            // Ensure no division by zero; handle cases where wins or losses could be zero
            const totalGames = vocabPack.cards[cardIndex].wins + vocabPack.cards[cardIndex].losses;
            vocabPack.cards[cardIndex].winrate = totalGames > 0 ? (vocabPack.cards[cardIndex].wins / totalGames * 100).toFixed(2) : 0;
        }

        // Apply other updates, excluding wins, losses, and winrate which are handled separately
        Object.keys(updates).forEach(updateKey => {
            if (!['wins', 'losses', 'winrate'].includes(updateKey)) {
                vocabPack.cards[cardIndex][updateKey] = updates[updateKey];
            }
        });

        // Save the updated vocabulary pack back to storage
        storage.set(key, JSON.stringify(vocabPack));
    } else {
        console.log('No card found with id:', cardId);
    }
};

export const recommendCard = (cards) => {
    if (!cards.length) return null;

    const weightedCards = cards.map(card => {
        return {
            ...card,
            weight: (1 / (parseFloat(card.winrate) + 0.01)) ** 2  // Ensure winrate is treated as a float
        };
    });

    const totalWeight = weightedCards.reduce((acc, card) => acc + card.weight, 0);
    console.log('Weighted Cards:', weightedCards);

    if (totalWeight === 0) {
        console.log('All cards have zero weight, selecting a random card.');
        return cards[Math.floor(Math.random() * cards.length)];
    }

    let cumulative = 0;
    const random = Math.random() * totalWeight;
    for (const card of weightedCards) {
        cumulative += card.weight;
        if (random <= cumulative) {
            return card;
        }
    }

    console.log('No card selected through weighted method, selecting a random card.');
    return cards[Math.floor(Math.random() * cards.length)];
};
