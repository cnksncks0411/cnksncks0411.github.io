// 게임 상태
const gameState = {
    players: [
        {
            id: 1,
            name: "플레이어 1",
            castles: 10,
            hand: [],
            isAI: false,
        },
        {
            id: 2,
            name: "플레이어 2 (AI)",
            castles: 10,
            hand: [],
            isAI: true,
        }
    ],
    currentPlayerIndex: 0,
    selectedCards: [],
    battleCards: {
        player: [],
        opponent: []
    },
    hasPassedThisRound: {
        1: false,
        2: false
    },
    round: 1,
    stage: 1,
    lastPlayerId: null,
    aiDifficulty: "보통", // 추가: AI 난이도 (쉬움, 보통, 어려움)
};

// 병력 카드와 무장 카드 정의
const cardTypes = ["📜", "🐎", "🏹", "⚔️"]; // 책사, 기병, 궁병, 보병
const cardTypeNames = ["책사", "기병", "궁병", "보병"];

// 게임 초기화
function initGame() {
    // 스타일 추가
    addCardHighlightStyles();
    addPreviewCardStyles();
    
    // 성 초기화
    updateCastlesDisplay();
    
    // 병력 카드 덱 생성
    const deck = [];
    for (let type = 0; type < cardTypes.length; type++) {
        for (let num = 1; num <= 20; num++) {
            deck.push({
                type: type,
                number: num,
                typeIcon: cardTypes[type],
                typeName: cardTypeNames[type]
            });
        }
    }
    
    // 덱 섞기
    shuffleDeck(deck);
    
    // 플레이어에게 카드 분배
    gameState.players[0].hand = deck.slice(0, 15);
    gameState.players[1].hand = deck.slice(15, 30);
    
    // 플레이어의 손패 표시
    renderPlayerHand();
    
    // 시작 플레이어 결정 (가장 낮은 숫자의 보병 카드를 가진 플레이어)
    determineStartingPlayer();
    
    // 스테이지와 성 정보 업데이트
    document.getElementById('current-stage').textContent = gameState.stage;
    document.getElementById('player1-castles-count').textContent = gameState.players[0].castles;
    document.getElementById('player2-castles-count').textContent = gameState.players[1].castles;
    
    updateStatusDisplay();
    addLogEntry(`게임이 시작되었습니다. ${gameState.players[gameState.currentPlayerIndex].name}의 차례입니다.`);
    
    // AI 플레이어 차례라면 AI 턴 실행
    if (gameState.players[gameState.currentPlayerIndex].isAI) {
        setTimeout(playAITurn, 1000);
    }
}

// AI 난이도 선택 모달 추가 (HTML)
function addAIDifficultyModal() {
    // 이미 모달이 존재하는지 확인
    if (document.getElementById('difficulty-modal')) {
        return;
    }
    
    const modalHTML = `
    <div id="difficulty-modal" class="modal">
        <div class="modal-content">
            <h2>AI 난이도 선택</h2>
            <p>게임을 시작하기 전에 AI의 난이도를 선택해주세요.</p>
            <div class="difficulty-buttons">
                <button id="easy-btn" class="difficulty-btn">쉬움</button>
                <button id="normal-btn" class="difficulty-btn selected">보통</button>
                <button id="hard-btn" class="difficulty-btn">어려움</button>
            </div>
            <div class="difficulty-desc" id="difficulty-desc">
                <p><strong>보통:</strong> 기본적인 전략을 사용하는 AI입니다. 대부분의 플레이어에게 적합합니다.</p>
            </div>
            <button id="start-game-btn" class="start-btn">게임 시작</button>
        </div>
    </div>
    `;
    
    // 모달 HTML 추가
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // 버튼 이벤트 리스너 추가
    document.getElementById('easy-btn').addEventListener('click', () => selectDifficulty('쉬움'));
    document.getElementById('normal-btn').addEventListener('click', () => selectDifficulty('보통'));
    document.getElementById('hard-btn').addEventListener('click', () => selectDifficulty('어려움'));
    document.getElementById('start-game-btn').addEventListener('click', startGameWithSelectedDifficulty);
}

// 난이도 선택 함수
function selectDifficulty(difficulty) {
    // 버튼 선택 상태 업데이트
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // 선택한 난이도 버튼 강조
    let btnId;
    switch (difficulty) {
        case '쉬움': btnId = 'easy-btn'; break;
        case '보통': btnId = 'normal-btn'; break;
        case '어려움': btnId = 'hard-btn'; break;
    }
    document.getElementById(btnId).classList.add('selected');
    
    // 난이도 설명 업데이트
    const descElement = document.getElementById('difficulty-desc');
    let description = '';
    
    switch (difficulty) {
        case '쉬움':
            description = '<strong>쉬움:</strong> 초보자에게 적합한 난이도입니다. AI는 기본적인 전략만 사용하고 실수를 자주 합니다.';
            break;
        case '보통':
            description = '<strong>보통:</strong> 기본적인 전략을 사용하는 AI입니다. 대부분의 플레이어에게 적합합니다.';
            break;
        case '어려움':
            description = '<strong>어려움:</strong> 고급 전략을 사용하는 AI입니다. 도전적인 게임을 원하는 플레이어에게 적합합니다.';
            break;
    }
    
    descElement.innerHTML = `<p>${description}</p>`;
    
    // 게임 상태에 난이도 저장
    gameState.aiDifficulty = difficulty;
}

// 선택한 난이도로 게임 시작
function startGameWithSelectedDifficulty() {
    // 모달 닫기
    document.getElementById('difficulty-modal').style.display = 'none';
    
    // AI 이름 업데이트 (난이도 표시)
    gameState.players[1].name = `플레이어 2 (AI - ${gameState.aiDifficulty})`;
    document.getElementById('player2-name').textContent = gameState.players[1].name;
    
    // 게임 시작
    initGame();
    
    // 난이도 설정 로그 추가
    addLogEntry(`AI 난이도가 '${gameState.aiDifficulty}'(으)로 설정되었습니다.`);
}

// 게임 초기화 전에 난이도 선택 모달 표시
function showDifficultyModal() {
    addAIDifficultyModal();
    document.getElementById('difficulty-modal').style.display = 'flex';
}

// AI 턴 실행 함수 - 난이도에 따른 로직 추가
function playAITurn() {
    // AI가 패스한 경우 처리
    if (gameState.hasPassedThisRound[2]) {
        // 이미 AI가 패스한 상태라면 처리 안함
        return;
    }
    
    // AI 결정 로직
    let cardsToPay = [];
    let aiCombination = null;
    
    // 이전에 낸 카드가 있으면 그보다 강한 조합을 찾기
    if (gameState.battleCards.player.length > 0) {
        const playerCombination = determineCombination(gameState.battleCards.player);
        
        // AI 난이도에 따른 로직 조정
        switch (gameState.aiDifficulty) {
            case '쉬움':
                // 쉬움 난이도: 가끔 실수하고 최적이 아닌 선택을 함
                if (Math.random() < 0.3) { // 30% 확률로 실수
                    // 랜덤한 패스 또는 최적이 아닌 카드 선택
                    if (Math.random() < 0.5) {
                        // 패스
                        gameState.hasPassedThisRound[2] = true;
                        addLogEntry('플레이어 2 (AI)가 패스했습니다.');
                        
                        if (gameState.battleCards.player.length > 0) {
                            addLogEntry(`플레이어 1이 라운드에서 승리했습니다.`);
                            gameState.lastPlayerId = 1;
                            startNewRound();
                            return;
                        }
                        
                        gameState.currentPlayerIndex = 0;
                        updateStatusDisplay();
                        return;
                    } else {
                        // 최적이 아닌 카드 선택 (그냥 첫 번째 카드)
                        if (gameState.players[1].hand.length > 0) {
                            cardsToPay = [gameState.players[1].hand[0]];
                            aiCombination = determineCombination(cardsToPay);
                        }
                    }
                } else {
                    // 일반적인 선택 (약간 약화된 전략)
                    cardsToPay = findBestCombination(gameState.players[1].hand, playerCombination, 0.7);
                }
                break;
                
            case '보통':
                // 보통 난이도: 기본 로직 사용
                cardsToPay = findBestCombination(gameState.players[1].hand, playerCombination, 1.0);
                break;
                
            case '어려움':
                // 어려움 난이도: 최적의 전략과 선제적 판단
                // 승리 가능성이 높은 카드 조합을 더 공격적으로 선택
                cardsToPay = findBestCombination(gameState.players[1].hand, playerCombination, 1.2);
                
                // 라운드 초반에 더 공격적으로 플레이
                if (gameState.players[1].hand.length > 10 && cardsToPay.length === 0) {
                    // 강한 카드를 먼저 내도록 시도
                    cardsToPay = findStrongestCombination(gameState.players[1].hand, playerCombination.priority);
                }
                break;
        }
        
        if (cardsToPay.length > 0) {
            aiCombination = determineCombination(cardsToPay);
        } else {
            // 강한 조합을 찾지 못했으면 패스
            gameState.hasPassedThisRound[2] = true;
            addLogEntry('플레이어 2 (AI)가 패스했습니다.');
            
            // AI가 패스했으므로 플레이어 승리로 처리
            if (gameState.battleCards.player.length > 0) {
                addLogEntry(`플레이어 1이 라운드에서 승리했습니다.`);
                gameState.lastPlayerId = 1; // 다음 라운드에 플레이어가 선공
                startNewRound();
                return;
            }
            
            // 턴 넘기기
            gameState.currentPlayerIndex = 0;
            updateStatusDisplay();
            return;
        }
    } else {
        // 첫 플레이어라면 난이도에 따른 첫 카드 선택
        switch (gameState.aiDifficulty) {
            case '쉬움':
                // 쉬움 난이도: 단순한 조합 선호 (단일 병력/확대 병력 위주)
                const simpleChoice = Math.random() < 0.7 ? 1 : 2; // 70% 확률로 단일 병력
                cardsToPay = chooseCardsByType(gameState.players[1].hand, simpleChoice);
                break;
                
            case '보통':
                // 보통 난이도: 기본 랜덤 선택
                const randomChoice = Math.floor(Math.random() * 4) + 1;
                cardsToPay = chooseCardsByType(gameState.players[1].hand, randomChoice);
                break;
                
            case '어려움':
                // 어려움 난이도: 강한 조합 선호 (진법/총력전 위주)
                const advancedChoice = Math.random() < 0.6 ? 
                    (Math.random() < 0.5 ? 3 : 4) : // 60% 확률로 진법 또는 총력전
                    (Math.random() < 0.5 ? 1 : 2);  // 40% 확률로 단일 또는 확대 병력
                cardsToPay = chooseCardsByType(gameState.players[1].hand, advancedChoice);
                break;
        }
        
        aiCombination = determineCombination(cardsToPay);
        
        // 유효한 조합이 아니면 단일 병력 사용
        if (!aiCombination) {
            cardsToPay = [gameState.players[1].hand[0]];
            aiCombination = determineCombination(cardsToPay);
        }
    }

    // AI 카드 내기
    gameState.battleCards.opponent = cardsToPay;
    
    // AI 손에서 카드 제거
    cardsToPay.forEach(card => {
        const index = gameState.players[1].hand.findIndex(c => 
            c.type === card.type && c.number === card.number);
        if (index !== -1) {
            gameState.players[1].hand.splice(index, 1);
        }
    });
    
    addLogEntry(`플레이어 2 (AI)가 ${aiCombination.name} 조합을 냈습니다.`);
    document.getElementById('player2-cards-count').textContent = gameState.players[1].hand.length;
    
    // 전투 카드 렌더링
    renderBattleCards();
    
    // 마지막 플레이어 업데이트
    gameState.lastPlayerId = 2;
    
    // AI의 카드가 없으면 라운드 종료
    if (gameState.players[1].hand.length === 0) {
        endRound(1);
        return;
    }
    
    // 턴 넘기기
    gameState.currentPlayerIndex = 0;
    updateStatusDisplay();
}

// 타입에 따른 카드 선택 함수
function chooseCardsByType(hand, type) {
    let cardsToPay = [];
    
    switch (type) {
        case 1: // 단일 병력
            cardsToPay = [hand[0]];
            break;
            
        case 2: // 확대 병력
            // 같은 병과 카드 찾기
            const typeCount = [0, 0, 0, 0];
            hand.forEach(card => typeCount[card.type]++);
            
            for (let i = 0; i < 4; i++) {
                if (typeCount[i] >= 2) {
                    const sameTypeCards = hand.filter(card => card.type === i);
                    cardsToPay = sameTypeCards.slice(0, 2);
                    break;
                }
            }
            
            if (cardsToPay.length !== 2) {
                cardsToPay = [hand[0]]; // 단일 병력으로 대체
            }
            break;
            
        case 3: // 진법
            // 책사 찾기
            const scholars = hand.filter(card => card.type === 0);
            
            if (scholars.length > 0) {
                const differentTypes = new Set();
                
                // 책사 추가
                cardsToPay.push(scholars[0]);
                differentTypes.add(0);
                
                // 다른 병과 2개 찾기
                for (const card of hand) {
                    if (card.type !== 0 && !differentTypes.has(card.type) && !cardsToPay.includes(card)) {
                        cardsToPay.push(card);
                        differentTypes.add(card.type);
                        
                        if (differentTypes.size === 3) break;
                    }
                }
                
                if (differentTypes.size !== 3) {
                    cardsToPay = [hand[0]]; // 단일 병력으로 대체
                }
            } else {
                cardsToPay = [hand[0]]; // 단일 병력으로 대체
            }
            break;
            
        case 4: // 총력전
            // 4가지 병과 모두 찾기
            const types = new Set();
            
            for (const card of hand) {
                if (!types.has(card.type) && !cardsToPay.includes(card)) {
                    cardsToPay.push(card);
                    types.add(card.type);
                    
                    if (types.size === 4) break;
                }
            }
            
            if (types.size !== 4) {
                cardsToPay = [hand[0]]; // 단일 병력으로 대체
            }
            break;
    }
    
    return cardsToPay;
}

// 난이도에 따른 최적 조합 찾기 함수 수정
function findBestCombination(hand, enemyCombination, difficultyFactor = 1.0) {
    if (!enemyCombination) return [hand[0]]; // 적 조합이 없으면 첫 번째 카드 반환
    
    // 가능한 모든 조합 생성 및 적 조합보다 강한지 확인
    const possibleCombinations = [];
    
    // 적과 같은 유형의 조합만 가능
    const requiredPriority = enemyCombination.priority;
    
    // 단일 병력
    if (requiredPriority === 1) {
        hand.forEach(card => {
            const combination = {
                cards: [card],
                combo: determineCombination([card])
            };
            
            if (combination.combo && (combination.combo.value > enemyCombination.value || 
                (combination.combo.value === enemyCombination.value && combination.combo.type < enemyCombination.type))) {
                possibleCombinations.push(combination);
            }
        });
    }
    
    // 확대 병력
    else if (requiredPriority === 2) {
        for (let i = 0; i < hand.length; i++) {
            for (let j = i + 1; j < hand.length; j++) {
                if (hand[i].type === hand[j].type) {
                    const cards = [hand[i], hand[j]];
                    const combo = determineCombination(cards);
                    
                    if (combo && (combo.value > enemyCombination.value || 
                        (combo.value === enemyCombination.value && combo.type < enemyCombination.type))) {
                        possibleCombinations.push({ cards, combo });
                    }
                }
            }
        }
    }
    
    // 진법
    else if (requiredPriority === 3) {
        for (let i = 0; i < hand.length; i++) {
            for (let j = i + 1; j < hand.length; j++) {
                for (let k = j + 1; k < hand.length; k++) {
                    const cards = [hand[i], hand[j], hand[k]];
                    const combo = determineCombination(cards);
                    
                    if (combo && combo.priority === 3 && (combo.value > enemyCombination.value || 
                        (combo.value === enemyCombination.value && combo.type < enemyCombination.type))) {
                        possibleCombinations.push({ cards, combo });
                    }
                }
            }
        }
    }
    
    // 총력전
    else if (requiredPriority === 4) {
        for (let i = 0; i < hand.length; i++) {
            for (let j = i + 1; j < hand.length; j++) {
                for (let k = j + 1; k < hand.length; k++) {
                    for (let l = k + 1; l < hand.length; l++) {
                        const cards = [hand[i], hand[j], hand[k], hand[l]];
                        const combo = determineCombination(cards);
                        
                        if (combo && combo.priority === 4 && combo.value > enemyCombination.value) {
                            possibleCombinations.push({ cards, combo });
                        }
                    }
                }
            }
        }
    }
    
    // 최적의 조합 선택 (강한 조합을 찾은 경우)
    if (possibleCombinations.length > 0) {
        // 난이도에 따른 선택 방식
        if (gameState.aiDifficulty === '쉬움') {
            // 쉬움: 랜덤하게 선택 (최적이 아닐 수 있음)
            const randomIndex = Math.floor(Math.random() * possibleCombinations.length);
            return possibleCombinations[randomIndex].cards;
        } else {
            // 조합 강도에 따라 정렬
            possibleCombinations.sort((a, b) => {
                // 어려움: 우선순위가 높은 조합 선호
                if (gameState.aiDifficulty === '어려움') {
                    if (a.combo.priority !== b.combo.priority) {
                        return b.combo.priority - a.combo.priority; // 높은 우선순위 선호
                    }
                } else {
                    // 보통: 우선순위가 낮은 조합 선호
                    if (a.combo.priority !== b.combo.priority) {
                        return a.combo.priority - b.combo.priority;
                    }
                }
                
                // 같은 우선순위면 값이 작은 것을 선호 (자원 절약)
                // 단, 어려움 난이도에서는 적보다 훨씬 높은 값을 낼 확률이 높음
                const diffFactor = gameState.aiDifficulty === '어려움' ? 
                    a.combo.value - enemyCombination.value : 
                    enemyCombination.value - a.combo.value;
                
                return diffFactor * difficultyFactor;
            });
            
            // 최적의 조합 선택
            return possibleCombinations[0].cards;
        }
    }
    
    return []; // 적합한 조합이 없으면 빈 배열 반환 (패스)
}

// 어려움 난이도용: 가장 강한 조합 찾기
function findStrongestCombination(hand, priorityType) {
    const possibleCombinations = [];
    
    // 진법 조합 찾기 (priorityType이 3이면)
    if (priorityType === 3) {
        // 책사 찾기
        const scholars = hand.filter(card => card.type === 0);
        
        if (scholars.length > 0) {
            // 가장 높은 값의 책사 찾기
            scholars.sort((a, b) => b.number - a.number);
            const bestScholar = scholars[0];
            
            // 다른 타입 카드 찾기
            const otherTypes = new Set();
            const selectedCards = [bestScholar];
            otherTypes.add(0); // 책사 타입 추가
            
            // 높은 값의 다른 타입 카드 찾기
            const remainingCards = hand.filter(card => card.type !== 0)
                .sort((a, b) => b.number - a.number);
            
            for (const card of remainingCards) {
                if (!otherTypes.has(card.type)) {
                    selectedCards.push(card);
                    otherTypes.add(card.type);
                    
                    if (otherTypes.size === 3) break;
                }
            }
            
            if (otherTypes.size === 3) {
                return selectedCards;
            }
        }
    }
    // 총력전 조합 찾기 (priorityType이 4이면)
    else if (priorityType === 4) {
        const typesAvailable = new Set(hand.map(card => card.type));
        
        if (typesAvailable.size === 4) {
            // 각 타입별 최고 카드 찾기
            const bestByType = {};
            
            for (const card of hand) {
                if (!bestByType[card.type] || card.number > bestByType[card.type].number) {
                    bestByType[card.type] = card;
                }
            }
            
            return Object.values(bestByType);
        }
    }
    // 확대 병력 조합 찾기 (priorityType이 2이면)
    else if (priorityType === 2) {
        // 타입별 카드 수 확인
        const typeCount = {};
        hand.forEach(card => {
            typeCount[card.type] = (typeCount[card.type] || 0) + 1;
        });
        
        // 개수가 2개 이상인 타입 중 가장 높은 값 찾기
        let bestType = null;
        let bestMax = 0;
        
        for (const type in typeCount) {
            if (typeCount[type] >= 2) {
                // 해당 타입의 카드 중 가장 높은 값 찾기
                const sameTypeCards = hand.filter(card => card.type === parseInt(type));
                const maxVal = Math.max(...sameTypeCards.map(card => card.number));
                
                if (maxVal > bestMax) {
                    bestMax = maxVal;
                    bestType = parseInt(type);
                }
            }
        }
        
        if (bestType !== null) {
            // 해당 타입의 가장 높은 값 2개 선택
            const sameTypeCards = hand.filter(card => card.type === bestType)
                .sort((a, b) => b.number - a.number);
            return sameTypeCards.slice(0, 2);
        }
    }
    // 단일 병력 조합 찾기 (priorityType이 1이면)
    else if (priorityType === 1) {
        // 가장 높은 값의 카드 찾기
        const highestCard = [...hand].sort((a, b) => {
            if (b.number !== a.number) {
                return b.number - a.number;
            }
            // 같은 값이면 타입이 낮은 것 선호 (책사, 기병, 궁병, 보병 순)
            return a.type - b.type;
        })[0];
        
        return [highestCard];
    }
    
    // 적합한 조합을 찾지 못하면 단일 병력 반환
    if (hand.length > 0) {
        return [hand[0]];
    }
    
    return []; // 카드가 없으면 빈 배열 반환
}

// 카드 하이라이트 스타일 추가 함수
function addCardHighlightStyles() {
    // 이미 스타일이 있는지 확인
    if (document.getElementById('card-highlight-styles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'card-highlight-styles';
    style.textContent = `
        /* 카드 하이라이트 스타일 */
        .highlight-card {
            border: 2px solid #7cfc00 !important; /* 연두색 테두리 */
            box-shadow: 0 0 10px rgba(124, 252, 0, 0.5); /* 연두색 그림자 */
        }

        /* 총력전 합계 표시 스타일 */
        .total-sum {
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #ffcc00;
            color: #8b0000;
            padding: 2px 8px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            z-index: 10;
        }

        /* 카드 컨테이너에 상대적 위치 지정 */
        .battle-cards-container {
            position: relative;
        }

        #player-battle-cards, #opponent-battle-cards {
            position: relative;
        }
    `;
    
    document.head.appendChild(style);
}

// 덱 섞기
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// 플레이어 손패 렌더링
function renderPlayerHand() {
    const handElement = document.getElementById('player-hand');
    handElement.innerHTML = '';
    
    // 플레이어 카드 정렬 (병과 타입 순, 숫자 순)
    // 원본 인덱스를 유지하는 객체 배열 생성
    const sortableHand = gameState.players[0].hand.map((card, index) => {
        return { card, originalIndex: index };
    });
    
    // 정렬
    sortableHand.sort((a, b) => {
        if (a.card.type !== b.card.type) {
            return a.card.type - b.card.type;
        }
        return a.card.number - b.card.number;
    });
    
    sortableHand.forEach((item, displayIndex) => {
        const card = item.card;
        const originalIndex = item.originalIndex;
        
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.index = originalIndex; // 원본 인덱스 저장
        
        const isSelected = gameState.selectedCards.includes(originalIndex);
        if (isSelected) {
            cardElement.classList.add('selected');
        }
        
        const numberElement = document.createElement('div');
        numberElement.className = 'card-number';
        numberElement.textContent = card.number;
        
        const typeElement = document.createElement('div');
        typeElement.className = 'card-type';
        typeElement.textContent = card.typeIcon;
        
        const tooltipElement = document.createElement('div');
        tooltipElement.className = 'tooltip';
        tooltipElement.textContent = `${card.typeName} ${card.number}`;
        
        cardElement.appendChild(numberElement);
        cardElement.appendChild(typeElement);
        cardElement.appendChild(tooltipElement);
        
        cardElement.addEventListener('click', () => selectCard(originalIndex));
        
        handElement.appendChild(cardElement);
    });
    
    // 카드 개수 업데이트
    document.getElementById('player1-cards-count').textContent = gameState.players[0].hand.length;
    document.getElementById('player2-cards-count').textContent = gameState.players[1].hand.length;
}

// 카드 선택
function selectCard(index) {
    // 이미 선택된 카드인 경우 선택 해제
    const cardIndex = gameState.selectedCards.indexOf(index);
    if (cardIndex !== -1) {
        gameState.selectedCards.splice(cardIndex, 1);
    } else {
        // 최대 4장까지만 선택 가능
        if (gameState.selectedCards.length < 4) {
            gameState.selectedCards.push(index);
        }
    }
    
    renderPlayerHand();
    validateSelectedCombination();
}

// 선택된 카드 조합 유효성 검사
function validateSelectedCombination() {
    const playBtn = document.getElementById('play-btn');
    const combinationDisplay = document.getElementById('combination-display');
    
    // 선택된 카드 합계 표시 엘리먼트
    let totalSumDisplay = document.getElementById('selected-total-sum');
    if (!totalSumDisplay) {
        totalSumDisplay = document.createElement('div');
        totalSumDisplay.id = 'selected-total-sum';
        totalSumDisplay.style.marginLeft = '10px';
        totalSumDisplay.style.fontWeight = 'bold';
        totalSumDisplay.style.color = '#8b0000';
        
        // combinationDisplay 옆에 추가
        combinationDisplay.parentElement.appendChild(totalSumDisplay);
    }
    
    if (gameState.selectedCards.length === 0) {
        playBtn.disabled = true;
        combinationDisplay.textContent = '';
        totalSumDisplay.textContent = '';
        return;
    }
    
    const selectedCards = gameState.selectedCards.map(index => gameState.players[0].hand[index]);
    const combination = determineCombination(selectedCards);
    
    if (combination) {
        playBtn.disabled = false;
        combinationDisplay.textContent = `조합: ${combination.name}`;
        
        // 총력전인 경우 합계 표시
        if (combination.priority === 4) {
            totalSumDisplay.textContent = `합계: ${combination.value}`;
        } else {
            totalSumDisplay.textContent = '';
        }
    } else {
        playBtn.disabled = true;
        combinationDisplay.textContent = '유효하지 않은 조합입니다.';
        totalSumDisplay.textContent = '';
    }
    
    // 선택한 카드 미리보기 영역에 하이라이트 적용
    updateSelectedCardsPreview(selectedCards, combination);
}

// 조합 결정
function determineCombination(cards, playerIndex) {
    const numCards = cards.length;
    const player = playerIndex !== undefined ? gameState.players[playerIndex] : null;

    // 단일 병력 (카드 1장)
    if (numCards === 1) {
        return {
            name: '단일 병력',
            value: cards[0].number,
            type: cards[0].type,
            priority: 1
        };
    }
    
    // 확대 병력 (같은 병과 2장)
    if (numCards === 2) {
        if (cards[0].type === cards[1].type) {
            const maxNumber = Math.max(cards[0].number, cards[1].number);
            return {
                name: '확대 병력',
                value: maxNumber,
                type: cards[0].type,
                priority: 2
            };
        }
    }
    
    // 진법 (서로 다른 병과 3장, 책사 필수)
    if (numCards === 3) {
        // 병과 타입 세트를 생성하여 모두 다른지 확인
        const typesSet = new Set(cards.map(card => card.type));
        
        // 서로 다른 병과가 3개이고, 책사(타입 3)가 포함되어 있는지 확인
        const hasScholar = cards.some(card => card.type === 0); // 책사 존재 여부
        
        // 일반적인 진법 조건
        if (typesSet.size === 3 && hasScholar) {
            const scholarCard = cards.find(card => card.type === 0);
            return {
                name: '진법',
                value: scholarCard.number,
                type: 0, // 책사
                priority: 3
            };
        }
    }
    
    // 총력전 (서로 다른 병과 4개)
    if (numCards === 4) {
        // 병과 타입 세트를 생성하여 모두 다른지 확인
        const typesSet = new Set(cards.map(card => card.type));
        
        if (typesSet.size === 4) {
            let totalValue = cards.reduce((sum, card) => sum + card.number, 0);

            return {
                name: '총력전',
                value: totalValue,
                type: -1, // 여러 타입
                priority: 4
            };
        }
    }
    
    return null; // 유효하지 않은 조합
}

// 선택한 카드 미리보기 함수
function updateSelectedCardsPreview(selectedCards, combination) {
    // 선택한 카드 미리보기 영역
    let previewArea = document.getElementById('selected-cards-preview');
    
    // 없으면 생성
    if (!previewArea) {
        previewArea = document.createElement('div');
        previewArea.id = 'selected-cards-preview';
        previewArea.className = 'selected-cards-preview';
        previewArea.style.display = 'flex';
        previewArea.style.justifyContent = 'center';
        previewArea.style.marginTop = '10px';
        previewArea.style.position = 'relative'; // 총합 표시를 위한 상대적 위치
        
        // 적절한 위치에 삽입 (조합 표시 아래)
        const playerActions = document.querySelector('.player-actions');
        playerActions.appendChild(previewArea);
    }
    
    // 미리보기 영역 초기화
    previewArea.innerHTML = '';
    
    // 카드가 없으면 표시 안함
    if (selectedCards.length === 0) {
        previewArea.style.display = 'none';
        return;
    }
    
    previewArea.style.display = 'flex';
    
    // 총력전인 경우 합계 표시
    if (combination && combination.priority === 4) {
        const totalSumElement = document.createElement('div');
        totalSumElement.className = 'total-sum';
        totalSumElement.textContent = `합계: ${combination.value}`;
        previewArea.appendChild(totalSumElement);
    }
    
    // 선택한 카드 렌더링
    selectedCards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'battle-card preview-card';
        
        // 조합에 따른 하이라이트 적용
        if (combination) {
            // 단일 병력: 유일한 카드에 하이라이트
            if (combination.priority === 1) {
                cardElement.classList.add('highlight-card');
            }
            // 확대 병력: 숫자가 가장 높은 카드에 하이라이트
            else if (combination.priority === 2) {
                // 같은 타입 중 가장 높은 숫자 찾기
                const maxNumber = Math.max(...selectedCards.map(c => c.number));
                if (card.number === maxNumber) {
                    cardElement.classList.add('highlight-card');
                }
            }
            // 진법: 책사 카드에 하이라이트
            else if (combination.priority === 3) {
                if (card.type === 0) { // 책사 타입이 0
                    cardElement.classList.add('highlight-card');
                }
            }
        }
        
        const numberElement = document.createElement('div');
        numberElement.className = 'card-number';
        numberElement.textContent = card.number;
        
        const typeElement = document.createElement('div');
        typeElement.className = 'card-type';
        typeElement.textContent = card.typeIcon;
        
        cardElement.appendChild(numberElement);
        cardElement.appendChild(typeElement);
        
        previewArea.appendChild(cardElement);
    });
}

// CSS 스타일 추가
function addPreviewCardStyles() {
    // 이미 스타일이 있는지 확인
    if (document.getElementById('preview-card-styles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'preview-card-styles';
    style.textContent = `
        .selected-cards-preview {
            margin: 10px 0;
            padding: 5px;
            border-radius: 5px;
            gap: 5px;
        }
        
        .preview-card {
            width: 50px;
            height: 70px;
            margin: 0 3px;
            font-size: 0.9em;
        }
        
        .preview-card .card-number {
            font-size: 1.2em;
        }
        
        .preview-card .card-type {
            font-size: 1.5em;
        }
    `;
    
    document.head.appendChild(style);
}

// 페이지 로드 시 스타일 추가
document.addEventListener('DOMContentLoaded', addPreviewCardStyles);

// 카드 내기
document.getElementById('play-btn').addEventListener('click', function() {
    const selectedCards = gameState.selectedCards.map(index => gameState.players[0].hand[index]);
    const combination = determineCombination(selectedCards);
    
    if (!combination) return;
    
    // 이전에 낸 카드가 있으면 같은 유형의 조합으로만 승부
    if (gameState.battleCards.opponent.length > 0) {
        const opponentCombination = determineCombination(gameState.battleCards.opponent);
        const currentCombination = determineCombination(selectedCards);
        
        // 조합 유형이 다르면 불가능
        if (opponentCombination.priority !== currentCombination.priority) {
            alert(`상대방이 ${opponentCombination.name}을(를) 냈습니다. 같은 유형의 조합으로만 승부할 수 있습니다.`);
            return;
        }
        
        // 같은 유형이지만 값이 낮으면 불가능
        if (opponentCombination.value > currentCombination.value || 
           (opponentCombination.value === currentCombination.value && opponentCombination.type < currentCombination.type)) {
            alert('같은 조합 유형 내에서 더 높은 값을 내야 합니다.');
            return;
        }
    }
    
    // 플레이어 손에서 카드 제거
    const cardIndices = [...gameState.selectedCards].sort((a, b) => b - a);
    const playedCards = [];
    
    cardIndices.forEach(index => {
        playedCards.push(gameState.players[0].hand[index]);
        gameState.players[0].hand.splice(index, 1);
    });
    
    // 전투 영역에 카드 놓기
    gameState.battleCards.player = playedCards;
    
    // 선택 초기화
    gameState.selectedCards = [];
    
    // 플레이어 패스 상태 업데이트
    gameState.hasPassedThisRound[1] = false;
    
    addLogEntry(`플레이어 1이 ${combination.name} 조합을 냈습니다.`);
    renderPlayerHand();
    renderBattleCards();
    
    // 마지막 플레이어 업데이트
    gameState.lastPlayerId = 1;
    
    // 플레이어의 카드가 없으면 라운드 종료
    if (gameState.players[0].hand.length === 0) {
        endRound(0);
        return;
    }
    
    // 턴 넘기기
    gameState.currentPlayerIndex = 1;
    updateStatusDisplay();
    
    // AI 턴 시작
    setTimeout(playAITurn, 1000);
});

// 패스 로직 수정 - 플레이어 패스
document.getElementById('pass-btn').addEventListener('click', function() {
    addLogEntry(`플레이어 1이 패스했습니다.`);
    gameState.hasPassedThisRound[1] = true;
    
    // 플레이어가 패스했으므로 AI가 라운드 승리
    // 만약 AI가 낸 카드가 있으면 AI 승리로 처리
    if (gameState.battleCards.opponent.length > 0) {
        addLogEntry(`플레이어 2 (AI)가 라운드에서 승리했습니다.`);
        gameState.lastPlayerId = 2; // 다음 라운드에 AI가 선공
        startNewRound();
        return;
    }
    
    // AI가 낸 카드가 없으면 턴 넘기기
    gameState.currentPlayerIndex = 1;
    updateStatusDisplay();
    
    // AI 턴 시작
    setTimeout(playAITurn, 1000);
});

// AI 턴 실행
function playAITurn() {
    // AI가 패스한 경우 처리
    if (gameState.hasPassedThisRound[2]) {
        // 이미 AI가 패스한 상태라면 처리 안함
        return;
    }
    
    // AI 결정 로직
    let cardsToPay = [];
    let aiCombination = null;
    
    // 이전에 낸 카드가 있으면 그보다 강한 조합을 찾기
    if (gameState.battleCards.player.length > 0) {
        const playerCombination = determineCombination(gameState.battleCards.player);
        
        // 가능한 모든 조합 시도
        cardsToPay = findBestCombination(gameState.players[1].hand, playerCombination);
        
        if (cardsToPay.length > 0) {
            aiCombination = determineCombination(cardsToPay);
        } else {
            // 강한 조합을 찾지 못했으면 패스
            gameState.hasPassedThisRound[2] = true;
            addLogEntry('플레이어 2 (AI)가 패스했습니다.');
            
            // AI가 패스했으므로 플레이어 승리로 처리
            // 만약 플레이어가 낸 카드가 있으면 플레이어 승리로 처리
            if (gameState.battleCards.player.length > 0) {
                addLogEntry(`플레이어 1이 라운드에서 승리했습니다.`);
                gameState.lastPlayerId = 1; // 다음 라운드에 플레이어가 선공
                startNewRound();
                return;
            }
            
            // 턴 넘기기
            gameState.currentPlayerIndex = 0;
            updateStatusDisplay();
            return;
        }
    } else {
        // 첫 플레이어라면 랜덤한 조합 선택
        const randomChoice = Math.floor(Math.random() * 4) + 1;
        
        switch (randomChoice) {
            case 1: // 단일 병력
                cardsToPay = [gameState.players[1].hand[0]];
                break;
            case 2: // 확대 병력
                // 같은 병과 카드 찾기
                const typeCount = [0, 0, 0, 0];
                gameState.players[1].hand.forEach(card => typeCount[card.type]++);
                
                for (let i = 0; i < 4; i++) {
                    if (typeCount[i] >= 2) {
                        const sameTypeCards = gameState.players[1].hand.filter(card => card.type === i);
                        cardsToPay = sameTypeCards.slice(0, 2);
                        break;
                    }
                }
                
                if (cardsToPay.length !== 2) {
                    cardsToPay = [gameState.players[1].hand[0]]; // 단일 병력으로 대체
                }
                break;
            case 3: // 진법
                // 책사 찾기
                const scholars = gameState.players[1].hand.filter(card => card.type === 0);
                
                if (scholars.length > 0) {
                    const differentTypes = new Set();
                    const candidateCards = [];
                    
                    // 책사 추가
                    cardsToPay.push(scholars[0]);
                    differentTypes.add(3);
                    
                    // 다른 병과 2개 찾기
                    for (const card of gameState.players[1].hand) {
                        if (card.type !== 0 && !differentTypes.has(card.type)) {
                            cardsToPay.push(card);
                            differentTypes.add(card.type);
                            
                            if (differentTypes.size === 3) break;
                        }
                    }
                    
                    if (differentTypes.size !== 3) {
                        cardsToPay = [gameState.players[1].hand[0]]; // 단일 병력으로 대체
                    }
                } else {
                    cardsToPay = [gameState.players[1].hand[0]]; // 단일 병력으로 대체
                }
                break;
            case 4: // 총력전
                // 4가지 병과 모두 찾기
                const types = new Set();
                
                for (const card of gameState.players[1].hand) {
                    if (!types.has(card.type)) {
                        cardsToPay.push(card);
                        types.add(card.type);
                        
                        if (types.size === 4) break;
                    }
                }
                
                if (types.size !== 4) {
                    cardsToPay = [gameState.players[1].hand[0]]; // 단일 병력으로 대체
                }
                break;
        }
        
        aiCombination = determineCombination(cardsToPay);
        
        // 유효한 조합이 아니면 단일 병력 사용
        if (!aiCombination) {
            cardsToPay = [gameState.players[1].hand[0]];
            aiCombination = determineCombination(cardsToPay);
        }
    }

    // AI 카드 내기
    gameState.battleCards.opponent = cardsToPay;
    
    // AI 손에서 카드 제거
    cardsToPay.forEach(card => {
        const index = gameState.players[1].hand.findIndex(c => 
            c.type === card.type && c.number === card.number);
        if (index !== -1) {
            gameState.players[1].hand.splice(index, 1);
        }
    });
    
    addLogEntry(`플레이어 2 (AI)가 ${aiCombination.name} 조합을 냈습니다.`);
    document.getElementById('player2-cards-count').textContent = gameState.players[1].hand.length;
    renderBattleCards();
    
    // 마지막 플레이어 업데이트
    gameState.lastPlayerId = 2;
    
    // AI의 카드가 없으면 라운드 종료
    if (gameState.players[1].hand.length === 0) {
        endRound(1);
        return;
    }
    
    // 턴 넘기기
    gameState.currentPlayerIndex = 0;
    updateStatusDisplay();
}

// 최적의 카드 조합 찾기 (AI용)
function findBestCombination(hand, enemyCombination) {
    if (!enemyCombination) return [hand[0]]; // 적 조합이 없으면 첫 번째 카드 반환
    
    // 가능한 모든 조합 생성 및 적 조합보다 강한지 확인
    const possibleCombinations = [];
    
    // 적과 같은 유형의 조합만 가능
    const requiredPriority = enemyCombination.priority;
    
    // 단일 병력
    if (requiredPriority === 1) {
        hand.forEach(card => {
            const combination = {
                cards: [card],
                combo: determineCombination([card])
            };
            
            if (combination.combo && combination.combo.value > enemyCombination.value || 
                (combination.combo.value === enemyCombination.value && combination.combo.type < enemyCombination.type)) {
                possibleCombinations.push(combination);
            }
        });
    }
    
    // 확대 병력
    else if (requiredPriority === 2) {
        for (let i = 0; i < hand.length; i++) {
            for (let j = i + 1; j < hand.length; j++) {
                if (hand[i].type === hand[j].type) {
                    const cards = [hand[i], hand[j]];
                    const combo = determineCombination(cards);
                    
                    if (combo && (combo.value > enemyCombination.value || 
                        (combo.value === enemyCombination.value && combo.type < enemyCombination.type))) {
                        possibleCombinations.push({ cards, combo });
                    }
                }
            }
        }
    }
    
    // 진법
    else if (requiredPriority === 3) {
        for (let i = 0; i < hand.length; i++) {
            for (let j = i + 1; j < hand.length; j++) {
                for (let k = j + 1; k < hand.length; k++) {
                    const cards = [hand[i], hand[j], hand[k]];
                    const combo = determineCombination(cards);
                    
                    if (combo && combo.priority === 3 && (combo.value > enemyCombination.value || 
                        (combo.value === enemyCombination.value && combo.type < enemyCombination.type))) {
                        possibleCombinations.push({ cards, combo });
                    }
                }
            }
        }
    }
    
    // 총력전
    else if (requiredPriority === 4) {
        for (let i = 0; i < hand.length; i++) {
            for (let j = i + 1; j < hand.length; j++) {
                for (let k = j + 1; k < hand.length; k++) {
                    for (let l = k + 1; l < hand.length; l++) {
                        const cards = [hand[i], hand[j], hand[k], hand[l]];
                        const combo = determineCombination(cards);
                        
                        if (combo && combo.priority === 4 && combo.value > enemyCombination.value) {
                            possibleCombinations.push({ cards, combo });
                        }
                    }
                }
            }
        }
    }
    
    // 최적의 조합 선택 (강한 조합을 찾은 경우)
    if (possibleCombinations.length > 0) {
        // 조합 강도에 따라 정렬
        possibleCombinations.sort((a, b) => {
            // 우선순위가 낮은 조합 선호 (비슷한 강도면 낮은 우선순위 선택)
            if (a.combo.priority !== b.combo.priority) {
                return a.combo.priority - b.combo.priority;
            }
            
            // 같은 우선순위면 값이 작은 것을 선호
            return a.combo.value - b.combo.value;
        });
        
        return possibleCombinations[0].cards;
    }
    
    return []; // 적합한 조합이 없으면 빈 배열 반환 (패스)
}

// 전투 카드 렌더링
function renderBattleCards() {
    const playerBattleArea = document.getElementById('player-battle-cards');
    const opponentBattleArea = document.getElementById('opponent-battle-cards');
    
    playerBattleArea.innerHTML = '';
    opponentBattleArea.innerHTML = '';
    
    // 플레이어 전투 카드 렌더링
    if (gameState.battleCards.player.length > 0) {
        // 전투 조합 확인
        const playerCombination = determineCombination(gameState.battleCards.player);
        
        // 총력전인 경우 합계 표시
        if (playerCombination && playerCombination.priority === 4) {
            const totalSumElement = document.createElement('div');
            totalSumElement.className = 'total-sum';
            totalSumElement.textContent = `합계: ${playerCombination.value}`;
            playerBattleArea.appendChild(totalSumElement);
        }
        
        gameState.battleCards.player.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'battle-card';
            
            // 조합에 따른 하이라이트 적용
            if (playerCombination) {
                // 단일 병력: 유일한 카드에 하이라이트
                if (playerCombination.priority === 1) {
                    cardElement.classList.add('highlight-card');
                }
                // 확대 병력: 숫자가 가장 높은 카드에 하이라이트
                else if (playerCombination.priority === 2) {
                    // 같은 타입 중 가장 높은 숫자 찾기
                    const maxNumber = Math.max(...gameState.battleCards.player.map(c => c.number));
                    if (card.number === maxNumber) {
                        cardElement.classList.add('highlight-card');
                    }
                }
                // 진법: 책사 카드에 하이라이트
                else if (playerCombination.priority === 3) {
                    if (card.type === 0) { // 책사 타입이 0
                        cardElement.classList.add('highlight-card');
                    }
                }
            }
            
            const numberElement = document.createElement('div');
            numberElement.className = 'card-number';
            numberElement.textContent = card.number;
            
            const typeElement = document.createElement('div');
            typeElement.className = 'card-type';
            typeElement.textContent = card.typeIcon;
            
            cardElement.appendChild(numberElement);
            cardElement.appendChild(typeElement);
            
            playerBattleArea.appendChild(cardElement);
        });
    }
    
    // 상대방 전투 카드 렌더링
    if (gameState.battleCards.opponent.length > 0) {
        // 전투 조합 확인
        const opponentCombination = determineCombination(gameState.battleCards.opponent);
        
        // 총력전인 경우 합계 표시
        if (opponentCombination && opponentCombination.priority === 4) {
            const totalSumElement = document.createElement('div');
            totalSumElement.className = 'total-sum';
            totalSumElement.textContent = `합계: ${opponentCombination.value}`;
            opponentBattleArea.appendChild(totalSumElement);
        }
        
        gameState.battleCards.opponent.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'battle-card';
            
            // 조합에 따른 하이라이트 적용
            if (opponentCombination) {
                // 단일 병력: 유일한 카드에 하이라이트
                if (opponentCombination.priority === 1) {
                    cardElement.classList.add('highlight-card');
                }
                // 확대 병력: 숫자가 가장 높은 카드에 하이라이트
                else if (opponentCombination.priority === 2) {
                    // 같은 타입 중 가장 높은 숫자 찾기
                    const maxNumber = Math.max(...gameState.battleCards.opponent.map(c => c.number));
                    if (card.number === maxNumber) {
                        cardElement.classList.add('highlight-card');
                    }
                }
                // 진법: 책사 카드에 하이라이트
                else if (opponentCombination.priority === 3) {
                    if (card.type === 0) { // 책사 타입이 0
                        cardElement.classList.add('highlight-card');
                    }
                }
            }
            
            const numberElement = document.createElement('div');
            numberElement.className = 'card-number';
            numberElement.textContent = card.number;
            
            const typeElement = document.createElement('div');
            typeElement.className = 'card-type';
            typeElement.textContent = card.typeIcon;
            
            cardElement.appendChild(numberElement);
            cardElement.appendChild(typeElement);
            
            opponentBattleArea.appendChild(cardElement);
        });
    }
}

// 상태 표시 업데이트
function updateStatusDisplay() {
    document.getElementById('player1-status').classList.toggle('active-player', gameState.currentPlayerIndex === 0);
    document.getElementById('player2-status').classList.toggle('active-player', gameState.currentPlayerIndex === 1);
    
    // 플레이 버튼과 패스 버튼 활성화/비활성화
    const playBtn = document.getElementById('play-btn');
    const passBtn = document.getElementById('pass-btn');
    
    if (gameState.currentPlayerIndex === 0) {
        passBtn.disabled = false;
        validateSelectedCombination(); // 선택한 카드 조합 검증
    } else {
        playBtn.disabled = true;
        passBtn.disabled = true;
    }
}

// 성 디스플레이 업데이트
function updateCastlesDisplay() {
    const player1Castles = document.getElementById('player1-castles');
    const player2Castles = document.getElementById('player2-castles');
    
    player1Castles.innerHTML = '';
    player2Castles.innerHTML = '';
    
    for (let i = 0; i < gameState.players[0].castles; i++) {
        player1Castles.innerHTML += '🏯';
    }
    
    for (let i = 0; i < gameState.players[1].castles; i++) {
        player2Castles.innerHTML += '🏯';
    }
    
    // 숫자로도 표시
    document.getElementById('player1-castles-count').textContent = gameState.players[0].castles;
    document.getElementById('player2-castles-count').textContent = gameState.players[1].castles;
}

// 시작 플레이어 결정
function determineStartingPlayer() {
    // 가장 낮은 숫자의 보병 카드 찾기
    let minValue = 21;
    let startingPlayerIndex = 0;
    
    for (let i = 0; i < gameState.players.length; i++) {
        const infantryCards = gameState.players[i].hand.filter(card => card.type === 3); // 보병
        
        if (infantryCards.length > 0) {
            const lowestInfantry = infantryCards.reduce((min, card) => 
                card.number < min.number ? card : min, { number: 21 });
            
            if (lowestInfantry.number < minValue) {
                minValue = lowestInfantry.number;
                startingPlayerIndex = i;
            }
        }
    }
    
    gameState.currentPlayerIndex = startingPlayerIndex;
}

// 로그 추가
function addLogEntry(text) {
    const logArea = document.getElementById('log-area');
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = text;
    
    logArea.appendChild(logEntry);
    logArea.scrollTop = logArea.scrollHeight;
}

// 라운드 종료
function endRound(winnerIndex) {
    const winner = gameState.players[winnerIndex];
    const loser = gameState.players[winnerIndex === 0 ? 1 : 0];
    
    // 결과 모달 표시
    const resultModal = document.getElementById('result-modal');
    const resultDisplay = document.getElementById('result-display');
    
    resultDisplay.textContent = `${winner.name}(이)가 스테이지에서 승리했습니다!`;
    resultModal.style.display = 'flex';
    
    // 성 이동
    const castlesToLose = loser.hand.length < 8 ? 1 : 2;
    loser.castles -= castlesToLose;
    winner.castles += castlesToLose;
    
    // 성 디스플레이 업데이트
    updateCastlesDisplay();
    
    // 성이 0이 되면 게임 종료
    if (loser.castles <= 0) {
        resultDisplay.textContent = `${winner.name}(이)가 천하를 통일했습니다!`;
        
        // 다음 라운드 버튼을 새 게임 버튼으로 변경
        const nextRoundBtn = document.getElementById('next-round-btn');
        nextRoundBtn.textContent = '새 게임';
        nextRoundBtn.onclick = function() {
            location.reload(); // 페이지 새로고침
        };
        
        return;
    }
    
    addLogEntry(`${winner.name}(이)가 스테이지에서 승리하여 ${loser.name}의 성 ${castlesToLose}개를 차지했습니다.`);
    
    // 다음 스테이지 버튼 설정
    document.getElementById('next-round-btn').textContent = '다음 스테이지';
    document.getElementById('next-round-btn').onclick = startNewStage;
}

// 새 라운드 시작
function startNewRound() {
    // 전투 카드 초기화
    gameState.battleCards = {
        player: [],
        opponent: []
    };
    
    // 패스 상태 초기화
    gameState.hasPassedThisRound = {
        1: false,
        2: false
    };
    
    // 라운드 증가
    gameState.round++;
    
    // 시작 플레이어 결정 (이전 라운드 마지막 플레이어)
    if (gameState.lastPlayerId) {
        gameState.currentPlayerIndex = gameState.lastPlayerId - 1;
    } else {
        determineStartingPlayer();
    }
    
    // 전투 영역 업데이트
    renderBattleCards();
    
    addLogEntry(`라운드 ${gameState.round}가 시작되었습니다. ${gameState.players[gameState.currentPlayerIndex].name}의 차례입니다.`);
    updateStatusDisplay();
    
    // AI 플레이어 차례라면 AI 턴 실행
    if (gameState.players[gameState.currentPlayerIndex].isAI) {
        setTimeout(playAITurn, 1000);
    }
}

function startNewStage () {
    const resultModal = document.getElementById('result-modal');
    resultModal.style.display = 'none';
        
    // 스테이지 증가
    gameState.stage++;
    document.getElementById('current-stage').textContent = gameState.stage;
    
    // 플레이어에게 새 카드 덱 지급
    const deck = [];
    for (let type = 0; type < cardTypes.length; type++) {
        for (let num = 1; num <= 20; num++) {
            deck.push({
                type: type,
                number: num,
                typeIcon: cardTypes[type],
                typeName: cardTypeNames[type]
            });
        }
    }
    
    // 덱 섞기
    shuffleDeck(deck);
    
    // 플레이어에게 카드 분배
    gameState.players[0].hand = deck.slice(0, 15);
    gameState.players[1].hand = deck.slice(15, 30);
    
    // 플레이어 손패 렌더링
    renderPlayerHand();
    
    // 라운드 초기화 및 시작
    gameState.round = 1;
    startNewRound();
}

// 도움말 버튼
document.getElementById('help-btn').addEventListener('click', function() {
    document.getElementById('rules-modal').style.display = 'flex';
});

// 규칙 모달 닫기 (하단 버튼)
document.getElementById('close-rules-btn').addEventListener('click', function() {
    document.getElementById('rules-modal').style.display = 'none';
});

// 규칙 모달 닫기 (X 버튼)
document.getElementById('close-rules-x').addEventListener('click', function() {
    document.getElementById('rules-modal').style.display = 'none';
});

// 결과 모달 닫기 (X 버튼)
document.getElementById('close-result-x').addEventListener('click', function() {
    document.getElementById('result-modal').style.display = 'none';
    if (document.getElementById('next-round-btn').textContent === '다음 라운드') {
        startNewRound();
    }else if (document.getElementById('next-round-btn').textContent === '다음 스테이지') {
        startNewStage();
    }
});

// 게임 시작
window.onload = showDifficultyModal;