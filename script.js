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
        
        // Moderate animate each letter individually
        const letters = this.text.querySelectorAll('.audio-letter');
        letters.forEach((letter, index) => {
            const letterIntensity = intensity * (0.5 + Math.random() * 0.8);
            const letterEnergy = energy * (0.6 + Math.random() * 0.6);
            const letterBpm = bpm * (0.7 + Math.random() * 0.6);
            const letterWave = Math.sin(currentTime * (8 + index * 2)) * letterIntensity * 40;
            const letterSpin = Math.cos(currentTime * (10 + index * 3)) * letterIntensity * 90;
            
            // Moderate individual letter animation
            letter.style.transform = `
                scale(${0.6 + letterIntensity * 1.2}) 
                rotate(${letterIntensity * 180 + letterSpin}deg)
                translateY(${-letterEnergy * 60 + letterWave}px)
                translateX(${Math.sin(currentTime * letterBpm * 0.1) * letterIntensity * 60 + Math.cos(currentTime * 6) * 30}px)
                skew(${Math.sin(currentTime * 12 + index) * letterIntensity * 20}deg, ${Math.cos(currentTime * 9 + index) * letterIntensity * 15}deg)
            `;
            
            // Moderate individual letter colors and effects
            const letterHue = (colorIntensity + index * 36 + currentTime * 50 + Math.sin(currentTime * 25) * 90) % 360;
            const letterSaturation = 60 + letterIntensity * 20;
            const letterLightness = 40 + letterEnergy * 25;
            
            letter.style.color = `hsl(${letterHue}, ${letterSaturation}%, ${letterLightness}%)`;
            letter.style.textShadow = `
                0 0 ${10 + letterIntensity * 20}px hsl(${letterHue}, 100%, 70%),
                0 0 ${20 + letterIntensity * 30}px hsl(${(letterHue + 120) % 360}, 100%, 50%),
                0 0 ${30 + letterIntensity * 40}px hsl(${(letterHue + 240) % 360}, 100%, 30%)
            `;
            letter.style.filter = `
                hue-rotate(${letterIntensity * 180}deg)
                saturate(${1 + letterIntensity * 1.5})
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
        
        // Moderate background color changes
        const hue = (intensity * 360 + this.audioPlayer.currentTime * 100 + Math.sin(currentTime * 8) * 90) % 360;
        const saturation = 60 + intensity * 15 + Math.sin(currentTime * 5) * 15;
        const lightness = 30 + intensity * 20 + Math.cos(currentTime * 4) * 15;
        document.body.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        
        // Add moderate background effects
        document.body.style.background = `
            radial-gradient(circle at ${50 + Math.sin(currentTime * 3) * 15}% ${50 + Math.cos(currentTime * 4) * 15}%, 
                hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness}%), 
                hsl(${hue}, ${saturation}%, ${lightness}%))
        `;
    }
}
