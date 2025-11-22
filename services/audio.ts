
// Web Audio API implementation for procedural sound generation
export class AudioService {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private bgmInterval: number | null = null;
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
        } catch (e) {
            console.error("Web Audio API not supported");
        }
    }

    toggleMute(mute: boolean) {
        this.isMuted = mute;
        if (this.ctx && this.masterGain) {
            this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.3, this.ctx.currentTime, 0.1);
        }
        if (mute) this.stopBGM();
        else this.startBGM();
    }

    // Procedural Sound Effects

    playHover() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playDrawCard() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }

    playAttack() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        // Sharp metallic sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 500;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playDefense() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        // Dull thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(80, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        // Lowpass to muffle it
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playHeal() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        // Rising glimmer
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.6);
    }

    playImpact(isCritical: boolean) {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = isCritical ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playBuff() {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        // Major triad arpeggio
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.1, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.4);
        });
    }

    // --- BGM Logic: Pentatonic Generator ---
    
    private playMelodyNote(freq: number, duration: number) {
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        // Plucked string synthesis: Sawtooth + Lowpass Filter Envelope
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        
        // Amplitude Envelope
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.02); // Fast attack
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration); // Long decay
        
        // Filter Envelope for "pluck" character
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + duration * 0.8);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + duration);
    }

    startBGM() {
        if (this.isMuted || !this.ctx || this.bgmInterval) return;

        // Pentatonic Scale (C Major Pentatonic roughly): C4, D4, E4, G4, A4
        // Frequencies: C4=261.6, D4=293.7, E4=329.6, G4=392.0, A4=440.0
        const scale = [196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00]; // G3 to A4
        
        const playNext = () => {
            if (this.isMuted) return;
            
            // Pick a random note from scale
            const noteIndex = Math.floor(Math.random() * scale.length);
            const freq = scale[noteIndex];
            const duration = 1.5 + Math.random(); // 1.5 to 2.5 seconds
            
            this.playMelodyNote(freq, duration);
            
            // Sometimes play a harmony note
            if (Math.random() > 0.7) {
                const harmonyIndex = (noteIndex + 2) % scale.length;
                this.playMelodyNote(scale[harmonyIndex] / 2, duration + 1); // Lower octave
            }
        };

        playNext(); // Play immediately
        
        // Schedule loop (slow, contemplative pace)
        this.bgmInterval = window.setInterval(() => {
            playNext();
        }, 2500); // Every 2.5 seconds
    }

    stopBGM() {
        if (this.bgmInterval) {
            window.clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }
}

export const audio = new AudioService();
