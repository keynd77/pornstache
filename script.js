let isDiscoMode = false;
let originalElements = {};
let discoElements = [];
let audioSync = null;

document.addEventListener('DOMContentLoaded', function() {
    const discoBtn = document.getElementById('discoBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const container = document.querySelector('.container');
    const image = document.querySelector('.centered-image');
    const text = document.querySelector('.centered-text');
    
    // Store original elements
    originalElements = {
        image: image.cloneNode(true),
        text: text.cloneNode(true),
        container: container.cloneNode(true)
    };
    
    discoBtn.addEventListener('click', function() {
        if (!isDiscoMode) {
            startDiscoMode();
        } else {
            resetDiscoMode();
        }
    });
    
    function startDiscoMode() {
        isDiscoMode = true;
        discoBtn.textContent = '🛑';
        
        // Start audio playback
        audioPlayer.play();
        
        // Split text into individual letters for audio sync
        const textContent = text.textContent;
        text.innerHTML = '';
        
        for (let i = 0; i < textContent.length; i++) {
            const letter = document.createElement('span');
            letter.textContent = textContent[i];
            letter.classList.add('audio-letter');
            letter.style.position = 'absolute';
            // Position each letter individually with specific X values, moved 50% more left
            letter.style.left = `${75 + (i * 50)}px`; // Moved 50% more left, each letter 50px more than the last
            letter.style.top = `50%`; // Fixed vertical position
            letter.style.fontSize = `${3.5}rem`; // Consistent size
            letter.style.zIndex = 10 + i;
            letter.style.width = `60px`; // Give each letter its own width
            letter.style.textAlign = `center`; // Center each letter in its space
            // No initial transform - letters are positioned by left property
            letter.style.transform = `translate(0, 0)`;
            text.appendChild(letter);
        }
        
        // Initialize audio synchronization
        audioSync = new AudioSync(audioPlayer, image, text, container);
        audioSync.start();
    }
    
    function resetDiscoMode() {
        isDiscoMode = false;
        discoBtn.textContent = '🪩';
        
        // Stop audio
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        
        // Stop audio synchronization
        if (audioSync) {
            audioSync.stop();
            audioSync = null;
        }
        
        // Reset image completely
        image.style.transform = '';
        image.style.filter = '';
        image.style.animation = '';
        
        // Reset text completely - restore original text content
        text.innerHTML = originalElements.text.textContent;
        text.style.transform = '';
        text.style.animation = '';
        
        // Reset container completely
        container.style.transform = '';
        container.style.animation = '';
        
        // Reset background completely
        document.body.style.backgroundColor = 'white';
        document.body.style.background = '';
        
        // Remove any disco classes that might have been added
        document.body.classList.remove('disco-background');
        container.classList.remove('disco-container');
        image.classList.remove('disco-image');
        
        // Reset any letter elements that might still exist
        const remainingLetters = document.querySelectorAll('.audio-letter');
        remainingLetters.forEach(letter => letter.remove());
    }
    
});

// Audio Synchronization Class
class AudioSync {
    constructor(audioPlayer, image, text, container) {
        this.audioPlayer = audioPlayer;
        this.image = image;
        this.text = text;
        this.container = container;
        this.currentBeatIndex = 0;
        this.animationId = null;
        this.isRunning = false;
    }
    
    start() {
        this.isRunning = true;
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    animate() {
        if (!this.isRunning) return;
        
        const currentTime = this.audioPlayer.currentTime;
        const beat = this.getCurrentBeat(currentTime);
        
        if (beat) {
            this.animateToBeat(beat);
        }
        
        // Use requestAnimationFrame for smooth 60fps animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    getCurrentBeat(currentTime) {
        // Find the closest beat to current time
        let closestBeat = null;
        let minDistance = Infinity;
        
        for (let i = 0; i < timingMap.length; i++) {
            const beat = timingMap[i];
            const distance = Math.abs(beat.time - currentTime);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestBeat = beat;
            }
        }
        
        return closestBeat;
    }
    
    animateToBeat(beat) {
        const intensity = beat.intensity;
        const energy = beat.energy;
        const bpm = beat.bpm;
        const rhythmSpeed = beat.rhythm_speed;
        const currentTime = this.audioPlayer.currentTime;
        
        // Calculate moderate animation intensity based on beat data
        const scaleIntensity = 0.8 + (intensity * 1.2); // More moderate scaling
        const rotationIntensity = intensity * 180 + Math.sin(currentTime * 10) * 90; // Moderate rotation
        const colorIntensity = intensity * 200;
        const crazyWave = Math.sin(currentTime * 8) * intensity * 40;
        const crazyBounce = Math.cos(currentTime * 12) * intensity * 30;
        
        // Moderate mustache animation
        this.image.style.transform = `
            scale(${scaleIntensity}) 
            rotate(${rotationIntensity}deg) 
            translateY(${-intensity * 80 + crazyBounce}px)
            translateX(${Math.sin(currentTime * 10) * intensity * 60 + crazyWave}px)
            skew(${Math.sin(currentTime * 15) * intensity * 15}deg, ${Math.cos(currentTime * 18) * intensity * 10}deg)
        `;
        
        // Moderate color effects to image
        this.image.style.filter = `
            hue-rotate(${colorIntensity + Math.sin(currentTime * 20) * 90}deg) 
            saturate(${1.5 + intensity * 2}) 
            brightness(${0.8 + intensity * 0.8})
            contrast(${1 + intensity * 0.5})
            blur(${intensity * 0.5}px)
        `;
        
        // Animate each letter individually to the music while keeping them readable
        const letters = this.text.querySelectorAll('.audio-letter');
        letters.forEach((letter, index) => {
            // Pre-calculate values to reduce computation
            const letterIntensity = intensity * (0.4 + index * 0.05);
            const letterEnergy = energy * (0.5 + index * 0.03);
            const timeOffset = currentTime + index * 0.3;
            
            // Music-responsive movement patterns that keep letters readable
            const beatWave = Math.sin(timeOffset * 4) * letterIntensity * 25; // Moderate movement
            const beatBounce = Math.cos(timeOffset * 6) * letterEnergy * 20; // Moderate bounce
            const beatSway = Math.sin(timeOffset * 3) * letterIntensity * 30; // Moderate sway
            const beatSpin = Math.cos(timeOffset * 5) * letterIntensity * 20; // Moderate rotation
            const beatPulse = Math.sin(timeOffset * 8) * letterIntensity * 0.3; // Moderate pulse
            
            // Music-responsive transform that maintains readability
            letter.style.transform = `
                scale(${0.9 + letterIntensity * 0.4 + beatPulse}) 
                rotate(${beatSpin}deg)
                translateY(${beatWave + beatBounce}px)
                translateX(${beatSway}px)
            `;
            
            // Optimized individual letter colors and effects
            const letterHue = (colorIntensity + index * 45 + currentTime * 60) % 360;
            const letterSaturation = 70 + letterIntensity * 20;
            const letterLightness = 40 + letterEnergy * 25;
            
            letter.style.color = `hsl(${letterHue}, ${letterSaturation}%, ${letterLightness}%)`;
            letter.style.textShadow = `
                0 0 ${15 + letterIntensity * 25}px hsl(${letterHue}, 100%, 80%),
                0 0 ${25 + letterIntensity * 35}px hsl(${(letterHue + 120) % 360}, 100%, 60%),
                0 0 ${35 + letterIntensity * 45}px hsl(${(letterHue + 240) % 360}, 100%, 40%)
            `;
            letter.style.filter = `
                hue-rotate(${letterIntensity * 180}deg)
                saturate(${1.2 + letterIntensity * 1.5})
                brightness(${0.7 + letterEnergy * 0.8})
            `;
        });
        
        // Moderate animate container based on rhythm speed
        this.container.style.transform = `
            scale(${0.9 + rhythmSpeed * 0.02 + Math.sin(currentTime * 4) * 0.1}) 
            rotate(${rhythmSpeed * 0.3 + Math.cos(currentTime * 6) * 15}deg)
            translateX(${Math.sin(currentTime * 3) * intensity * 20}px)
            translateY(${Math.cos(currentTime * 4) * intensity * 15}px)
        `;
        
        // Optimized background color changes
        const hue = (intensity * 180 + currentTime * 50) % 360;
        const saturation = 50 + intensity * 20;
        const lightness = 40 + intensity * 15;
        document.body.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
}
