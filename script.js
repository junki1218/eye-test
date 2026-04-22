document.addEventListener('DOMContentLoaded', () => {
    const ring = document.getElementById('landolt-ring');
    const animalContainer = document.getElementById('animal-silhouette');
    const btnRotate = document.getElementById('btn-rotate');
    const btnModeToggle = document.getElementById('btn-mode-toggle');
    const btnSizeUp = document.getElementById('btn-size-up');
    const btnSizeDown = document.getElementById('btn-size-down');
    const sizeDisplay = document.getElementById('current-size');
    const feedbackOverlay = document.getElementById('feedback-overlay');
    const btnCorrect = document.getElementById('btn-correct');
    const btnWrong = document.getElementById('btn-wrong');

    let currentSizeLevel = 3;
    let currentRotation = 0;
    let currentAnimalIndex = 0;
    let isTransitioning = false;
    let isAnimalMode = false;

    const orientations = [0, 90, 180, 270]; // 右, 下, 左, 上

    // 動物の画像パス (Icoｎフォルダ内の1.png〜4.png)
    const animals = [
        'Icoｎ/1.png',
        'Icoｎ/2.png',
        'Icoｎ/3.png',
        'Icoｎ/4.png'
    ];

    // Web Audio APIの初期化
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();

    /**
     * 効果音を再生する
     * @param {string} type 'correct' または 'wrong'
     */
    function playSound(type) {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'correct') {
            // ピッピッ（高い音2回）
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, now);
            oscillator.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
            
            oscillator.start(now);
            oscillator.stop(now + 0.2);
        } else {
            // ブー（低い音1回）
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(220, now);
            oscillator.frequency.linearRampToValueAtTime(110, now + 0.3);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.1, now + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
            
            oscillator.start(now);
            oscillator.stop(now + 0.3);
        }
    }

    /**
     * 判定を表示する
     * @param {string} type 'correct' または 'wrong'
     */
    function showFeedback(type) {
        playSound(type);
        
        feedbackOverlay.textContent = type === 'correct' ? '○' : '×';
        feedbackOverlay.className = `feedback-overlay show ${type}`;
        
        setTimeout(() => {
            feedbackOverlay.classList.remove('show');
        }, 500);
    }

    /**
     * ランドルト環を一時的に消して更新する
     * @param {Function} updateFn 状態を更新する関数
     */
    function updateRingWithAnimation(updateFn) {
        if (isTransitioning) return;
        isTransitioning = true;

        const activeElement = isAnimalMode ? animalContainer : ring;
        activeElement.classList.add('hidden');
        
        setTimeout(() => {
            updateFn();
            // 少し長めに待ってから再表示する（変化をわかりにくくするため）
            setTimeout(() => {
                activeElement.classList.remove('hidden');
                setTimeout(() => {
                    isTransitioning = false;
                }, 100);
            }, 300); // 隠れている時間を追加
        }, 100);
    }

    /**
     * モードを切り替える
     */
    function toggleMode() {
        if (isTransitioning) return;
        
        isAnimalMode = !isAnimalMode;
        console.log("Mode toggled. Animal mode:", isAnimalMode); // デバッグ用
        
        if (isAnimalMode) {
            ring.classList.add('display-none');
            animalContainer.classList.remove('display-none');
            updateAnimal();
        } else {
            animalContainer.classList.add('display-none');
            ring.classList.remove('display-none');
            rotateRandomly();
        }
    }

    /**
     * 動物をランダムに変更する
     */
    function updateAnimal() {
        updateRingWithAnimation(() => {
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * animals.length);
            } while (nextIndex === currentAnimalIndex);
            
            currentAnimalIndex = nextIndex;
            animalContainer.innerHTML = `<img src="${animals[currentAnimalIndex]}" alt="動物のシルエット" style="width:100%; height:100%; object-fit:contain;">`;
        });
    }

    /**
     * ランドルト環の向きをランダムに変更する
     */
    function rotateRandomly() {
        if (isAnimalMode) {
            updateAnimal();
            return;
        }

        updateRingWithAnimation(() => {
            let newRotation;
            do {
                newRotation = orientations[Math.floor(Math.random() * orientations.length)];
            } while (newRotation === currentRotation);

            currentRotation = newRotation;
            ring.style.transform = `rotate(${currentRotation}deg)`;
        });
    }

    /**
     * サイズを変更する
     * @param {number} delta 1 (大きく) または -1 (小さく)
     */
    function changeSize(delta) {
        const nextLevel = currentSizeLevel + delta;
        if (nextLevel >= 1 && nextLevel <= 5) {
            updateRingWithAnimation(() => {
                const target = isAnimalMode ? animalContainer : ring;
                target.classList.remove(`level-${currentSizeLevel}`);
                currentSizeLevel = nextLevel;
                target.classList.add(`level-${currentSizeLevel}`);
                
                sizeDisplay.textContent = currentSizeLevel;

                btnSizeUp.style.opacity = currentSizeLevel === 5 ? '0.3' : '1';
                btnSizeUp.style.cursor = currentSizeLevel === 5 ? 'default' : 'pointer';
                btnSizeDown.style.opacity = currentSizeLevel === 1 ? '0.3' : '1';
                btnSizeDown.style.cursor = currentSizeLevel === 1 ? 'default' : 'pointer';
            });
        }
    }

    // イベントリスナー
    const clickEvent = ('ontouchstart' in window) ? 'touchstart' : 'click';

    btnRotate.addEventListener('click', (e) => {
        e.preventDefault();
        rotateRandomly();
    });

    btnModeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMode();
    });
    
    btnSizeUp.addEventListener('click', (e) => {
        e.preventDefault();
        changeSize(1);
    });

    btnSizeDown.addEventListener('click', (e) => {
        e.preventDefault();
        changeSize(-1);
    });

    btnCorrect.addEventListener('click', (e) => {
        e.preventDefault();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        showFeedback('correct');
    });
    
    btnWrong.addEventListener('click', (e) => {
        e.preventDefault();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        showFeedback('wrong');
    });

    // キーボード操作の追加
    document.addEventListener('keydown', (e) => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        switch (e.key) {
            case 'm': // モード切替
            case 'M':
                toggleMode();
                break;
            case 'ArrowUp':
                changeSize(1);
                break;
            case 'ArrowDown':
                changeSize(-1);
                break;
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'Enter':
            case ' ':
                rotateRandomly();
                break;
            case 'o': // ○
            case 'O':
                showFeedback('correct');
                break;
            case 'x': // ×
            case 'X':
                showFeedback('wrong');
                break;
        }
    });

    // 初期状態の設定
    animalContainer.classList.add('display-none');
    
    // 初回はアニメーションなしで表示
    currentRotation = orientations[Math.floor(Math.random() * orientations.length)];
    ring.style.transform = `rotate(${currentRotation}deg)`;
});
