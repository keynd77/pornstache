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
            letter.style.left = `${30 + (i * 8)}%`;
            letter.style.top = `${40 + Math.random() * 20}%`;
            letter.style.fontSize = `${3 + Math.random() * 4}rem`;
            letter.style.zIndex = 10 + i;
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
        
        // Reset image
        image.style.transform = '';
        image.style.filter = '';
        
        // Reset text
        text.innerHTML = originalElements.text.textContent;
        text.style.transform = '';
        
        // Reset container
        container.style.transform = '';
        
        // Reset background
        document.body.style.backgroundColor = 'white';
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
        
        // Calculate CRAZY animation intensity based on beat data
        const scaleIntensity = 0.5 + (intensity * 2.5); // Much more extreme scaling
        const rotationIntensity = intensity * 1440 + Math.sin(currentTime * 20) * 360; // Insane rotation
        const colorIntensity = intensity * 400;
        const crazyWave = Math.sin(currentTime * 15) * intensity * 100;
        const crazyBounce = Math.cos(currentTime * 25) * intensity * 80;
        
        // CRAZY mustache animation
        this.image.style.transform = `
            scale(${scaleIntensity}) 
            rotate(${rotationIntensity}deg) 
            translateY(${-intensity * 200 + crazyBounce}px)
            translateX(${Math.sin(currentTime * 20) * intensity * 150 + crazyWave}px)
            skew(${Math.sin(currentTime * 30) * intensity * 45}deg, ${Math.cos(currentTime * 35) * intensity * 30}deg)
        `;
        
        // INSANE color effects to image
        this.image.style.filter = `
            hue-rotate(${colorIntensity + Math.sin(currentTime * 40) * 180}deg) 
            saturate(${2 + intensity * 5}) 
            brightness(${0.5 + intensity * 2})
            contrast(${1 + intensity * 1.5})
            blur(${intensity * 2}px)
        `;
        
        // CRAZY animate each letter individually
        const letters = this.text.querySelectorAll('.audio-letter');
        letters.forEach((letter, index) => {
            const letterIntensity = intensity * (0.3 + Math.random() * 1.2);
            const letterEnergy = energy * (0.5 + Math.random() * 1.0);
            const letterBpm = bpm * (0.5 + Math.random() * 1.0);
            const letterWave = Math.sin(currentTime * (15 + index * 3)) * letterIntensity * 120;
            const letterSpin = Math.cos(currentTime * (20 + index * 5)) * letterIntensity * 360;
            
            // INSANE individual letter animation
            letter.style.transform = `
                scale(${0.3 + letterIntensity * 2.5}) 
                rotate(${letterIntensity * 720 + letterSpin}deg)
                translateY(${-letterEnergy * 200 + letterWave}px)
                translateX(${Math.sin(currentTime * letterBpm * 0.2) * letterIntensity * 200 + Math.cos(currentTime * 12) * 100}px)
                skew(${Math.sin(currentTime * 25 + index) * letterIntensity * 60}deg, ${Math.cos(currentTime * 18 + index) * letterIntensity * 40}deg)
            `;
            
            // CRAZY individual letter colors and effects
            const letterHue = (colorIntensity + index * 72 + currentTime * 100 + Math.sin(currentTime * 50) * 180) % 360;
            const letterSaturation = 70 + letterIntensity * 30;
            const letterLightness = 30 + letterEnergy * 40;
            
            letter.style.color = `hsl(${letterHue}, ${letterSaturation}%, ${letterLightness}%)`;
            letter.style.textShadow = `
                0 0 ${20 + letterIntensity * 40}px hsl(${letterHue}, 100%, 70%),
                0 0 ${40 + letterIntensity * 60}px hsl(${(letterHue + 120) % 360}, 100%, 50%),
                0 0 ${60 + letterIntensity * 80}px hsl(${(letterHue + 240) % 360}, 100%, 30%)
            `;
            letter.style.filter = `
                hue-rotate(${letterIntensity * 360}deg)
                saturate(${1 + letterIntensity * 3})
                brightness(${0.5 + letterEnergy * 1.5})
            `;
        });
        
        // CRAZY animate container based on rhythm speed
        this.container.style.transform = `
            scale(${0.8 + rhythmSpeed * 0.05 + Math.sin(currentTime * 8) * 0.3}) 
            rotate(${rhythmSpeed * 0.8 + Math.cos(currentTime * 12) * 45}deg)
            translateX(${Math.sin(currentTime * 6) * intensity * 50}px)
            translateY(${Math.cos(currentTime * 9) * intensity * 30}px)
        `;
        
        // INSANE background color changes
        const hue = (intensity * 720 + this.audioPlayer.currentTime * 200 + Math.sin(currentTime * 15) * 180) % 360;
        const saturation = 80 + intensity * 20 + Math.sin(currentTime * 10) * 20;
        const lightness = 20 + intensity * 30 + Math.cos(currentTime * 8) * 20;
        document.body.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        
        // Add CRAZY background effects
        document.body.style.background = `
            radial-gradient(circle at ${50 + Math.sin(currentTime * 5) * 30}% ${50 + Math.cos(currentTime * 7) * 30}%, 
                hsl(${(hue + 120) % 360}, ${saturation}%, ${lightness}%), 
                hsl(${hue}, ${saturation}%, ${lightness}%))
        `;
    }
}
