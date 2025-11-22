
// Web Audio API implementation & HTML5 Audio for BGM
export class AudioService {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private bgmAudio: HTMLAudioElement | null = null;
    private isMuted: boolean = false;

    constructor() {
        // Initialize lazily
    }

    init() {
        if (this.ctx) return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3; 
            this.masterGain.connect(this.ctx.destination);

            // Setup HTML5 Audio for BGM
            // Epic Action / Drum & Bass style
            this.bgmAudio = new Audio('https://cdn.pixabay.com/audio/2023/09/28/audio_270885b9a0.mp3'); 
            this.bgmAudio.loop = true;
            this.bgmAudio.volume = 0.4;
            
        } catch (e) {
            console.error("Web Audio API not supported");
        }
    }

    toggleMute(mute: boolean) {
        this.isMuted = mute;
        if (this.ctx && this.masterGain) {
            this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.3, this.ctx.currentTime, 0.1);
        }
        if (this.bgmAudio) {
            if (mute) this.bgmAudio.pause();
            else this.bgmAudio.play().catch(() => {});
        }
    }

    startBGM() {
        if (this.isMuted || !this.bgmAudio) return;
        this.bgmAudio.play().catch(e => console.log("Audio play blocked until interaction"));
    }

    stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
        }
    }

    // --- Procedural Sound Effects ---

    playHover() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.05);
        
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.05);
    }

    playDrawCard() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        const t = this.ctx.currentTime;
        
        // Paper-like noise slide
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.linearRampToValueAtTime(1200, t + 0.1);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
    }

    playAttack() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        const t = this.ctx.currentTime;

        // 1. Whoosh (Noise)
        const bufferSize = this.ctx.sampleRate * 0.2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(800, t);
        noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 0.2);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.6, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(t);

        // 2. Impact Punch (Oscillator)
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        
        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.4, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    playDefense() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        const t = this.ctx.currentTime;

        // Metallic Clang (Dissonant Sines)
        const freqs = [200, 300, 540, 800];
        freqs.forEach((f, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            
            osc.type = i % 2 === 0 ? 'square' : 'triangle';
            osc.frequency.setValueAtTime(f, t);
            
            // Fast attack, long decay
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            
            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start(t);
            osc.stop(t + 0.5);
        });
    }

    playHeal() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        const t = this.ctx.currentTime;

        // Magical Arpeggio
        const notes = [440, 554, 659, 880]; // A major
        notes.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = t + i * 0.08;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
            
            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start(startTime);
            osc.stop(startTime + 0.8);
        });
    }

    playImpact(isCritical: boolean) {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        const t = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = isCritical ? 'sawtooth' : 'triangle';
        // Deep impact or sharp crack
        osc.frequency.setValueAtTime(isCritical ? 200 : 100, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
        
        gain.gain.setValueAtTime(isCritical ? 0.8 : 0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

        // Lowpass filter for body
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isCritical ? 3000 : 500, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.4);
    }

    playBuff() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        this.playHeal(); // Reuse heal sound for now as it fits "Generate"
    }
}

export const audio = new AudioService();
