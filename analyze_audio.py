#!/usr/bin/env python3
"""
Comprehensive Audio Analysis Script
Analyzes rhythm, tempo, BPM changes, and all audio characteristics
"""

import librosa
import numpy as np
import json
import re

def update_audio_file_in_html(audio_file):
    """Update the audio file path in index.html"""
    try:
        # Read the current HTML file
        with open('index.html', 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Find and replace the audio source
        # Look for patterns like: new Audio("sound.mp3") or src="sound.mp3"
        audio_patterns = [
            r'new Audio\(["\']([^"\']*\.(mp3|wav|ogg|m4a))["\']\)',  # new Audio("file.mp3")
            r'src=["\']([^"\']*\.(mp3|wav|ogg|m4a))["\']'  # src="file.mp3"
        ]
        
        new_html_content = html_content
        for pattern in audio_patterns:
            new_html_content = re.sub(pattern, lambda m: m.group(0).replace(m.group(1), audio_file), new_html_content)
        
        # Write the updated HTML back
        with open('index.html', 'w', encoding='utf-8') as f:
            f.write(new_html_content)
        
        print(f"📄 Updated audio file in index.html to: {audio_file}")
        
    except Exception as e:
        print(f"⚠️  Warning: Could not update HTML file: {e}")

def analyze_audio(audio_file):
    print("🎵 COMPREHENSIVE AUDIO ANALYSIS")
    print("=" * 50)
    
    # Load audio
    y, sr = librosa.load(audio_file)
    duration = len(y) / sr
    
    print(f"📊 Basic Info:")
    print(f"  Duration: {duration:.2f}s")
    print(f"  Sample Rate: {sr} Hz")
    print(f"  Samples: {len(y)}")
    
    # 1. BEAT DETECTION
    print(f"\n🎯 Beat Detection:")
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, units='time')
    onset_frames = librosa.onset.onset_detect(y=y, sr=sr, units='time')
    
    # Combine and get unique beats
    all_beats = np.concatenate([beat_frames, onset_frames])
    all_beats = np.unique(np.round(all_beats, 3))
    
    # Calculate intensity for each beat
    onset_envelope = librosa.onset.onset_strength(y=y, sr=sr)
    beats = []
    
    for beat_time in all_beats:
        beat_frame = librosa.time_to_frames(beat_time, sr=sr)
        if beat_frame < len(onset_envelope):
            intensity = onset_envelope[beat_frame]
            intensity = np.clip(intensity / np.max(onset_envelope), 0.1, 1.0)
        else:
            intensity = 0.5
            
        beats.append({
            'time': float(beat_time),
            'intensity': float(intensity),
            'type': 'strong' if intensity > 0.6 else 'weak'
        })
    
    beats.sort(key=lambda x: x['time'])
    print(f"  Total beats: {len(beats)}")
    print(f"  Average BPM: {len(beats) * 60 / duration:.1f}")
    
    # 2. TEMPO ANALYSIS
    print(f"\n📈 Tempo Analysis:")
    
    # Analyze tempo in sliding windows
    window_size = 8  # 8 beats per window
    tempo_changes = []
    previous_bpm = None
    
    for i in range(0, len(beats) - window_size, 4):  # 4 beat hop
        window_beats = beats[i:i + window_size]
        
        if len(window_beats) < 2:
            continue
            
        # Calculate BPM for this window
        time_span = window_beats[-1]['time'] - window_beats[0]['time']
        if time_span > 0:
            bpm = (len(window_beats) - 1) * 60 / time_span
            
            # Detect significant tempo changes (>10% change)
            if previous_bpm is None or abs(bpm - previous_bpm) > previous_bpm * 0.1:
                if previous_bpm is None:
                    change_type = 'start'
                elif bpm > previous_bpm:
                    change_type = 'increase'
                else:
                    change_type = 'decrease'
                
                tempo_changes.append({
                    'time': window_beats[0]['time'],
                    'bpm': float(bpm),
                    'change': float(bpm - previous_bpm) if previous_bpm else 0.0,
                    'type': change_type
                })
                
                previous_bpm = bpm
    
    print(f"  Tempo changes: {len(tempo_changes)}")
    if tempo_changes:
        bpms = [change['bpm'] for change in tempo_changes]
        print(f"  BPM range: {min(bpms):.1f} - {max(bpms):.1f}")
    
    # 3. RHYTHM ANALYSIS
    print(f"\n🎼 Rhythm Analysis:")
    
    # Calculate inter-beat intervals
    intervals = []
    for i in range(1, len(beats)):
        interval = beats[i]['time'] - beats[i-1]['time']
        intervals.append(interval)
    
    if intervals:
        mean_interval = np.mean(intervals)
        std_interval = np.std(intervals)
        rhythm_consistency = 1.0 - (std_interval / mean_interval) if mean_interval > 0 else 0.0
        
        print(f"  Mean beat interval: {mean_interval:.3f}s")
        print(f"  Rhythm consistency: {rhythm_consistency:.2f}")
        print(f"  Interval range: {min(intervals):.3f}s - {max(intervals):.3f}s")
    
    # 4. ENERGY ANALYSIS
    print(f"\n⚡ Energy Analysis:")
    
    # Calculate RMS energy
    hop_length = 512
    rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
    times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop_length)
    
    # Find energy peaks
    energy_peaks = []
    for i in range(1, len(rms) - 1):
        if rms[i] > rms[i-1] and rms[i] > rms[i+1] and rms[i] > np.mean(rms) * 1.5:
            energy_peaks.append({
                'time': float(times[i]),
                'energy': float(rms[i])
            })
    
    print(f"  Energy peaks: {len(energy_peaks)}")
    print(f"  Average energy: {np.mean(rms):.3f}")
    print(f"  Energy range: {np.min(rms):.3f} - {np.max(rms):.3f}")
    
    # 4.5. SILENCE DETECTION
    print(f"\n🔇 Silence Detection:")
    
    # Calculate silence threshold (very low energy)
    silence_threshold = np.mean(rms) * 0.1  # 10% of average energy
    min_silence_duration = 0.5  # Minimum 0.5 seconds to be considered silence
    
    # Find silent periods
    silent_periods = []
    in_silence = False
    silence_start = 0
    
    for i, (time, energy) in enumerate(zip(times, rms)):
        if energy < silence_threshold:
            if not in_silence:
                in_silence = True
                silence_start = time
        else:
            if in_silence:
                silence_duration = time - silence_start
                if silence_duration >= min_silence_duration:
                    silent_periods.append({
                        'start': float(silence_start),
                        'end': float(time),
                        'duration': float(silence_duration),
                        'avg_energy': float(np.mean(rms[int(silence_start * sr / hop_length):int(time * sr / hop_length)]))
                    })
                in_silence = False
    
    # Handle case where silence continues to end of track
    if in_silence:
        silence_duration = duration - silence_start
        if silence_duration >= min_silence_duration:
            silent_periods.append({
                'start': float(silence_start),
                'end': float(duration),
                'duration': float(silence_duration),
                'avg_energy': float(np.mean(rms[int(silence_start * sr / hop_length):]))
            })
    
    print(f"  Silence threshold: {silence_threshold:.4f}")
    print(f"  Silent periods: {len(silent_periods)}")
    if silent_periods:
        total_silence = sum(period['duration'] for period in silent_periods)
        print(f"  Total silence time: {total_silence:.2f}s ({total_silence/duration*100:.1f}% of track)")
        print(f"  Longest silence: {max(period['duration'] for period in silent_periods):.2f}s")
        print(f"  Shortest silence: {min(period['duration'] for period in silent_periods):.2f}s")
    else:
        print(f"  No significant silent periods detected")
    
    # 5. SPECTRAL ANALYSIS
    print(f"\n🌈 Spectral Analysis:")
    
    # Get spectral centroid (brightness)
    spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    spectral_times = librosa.frames_to_time(np.arange(len(spectral_centroids)), sr=sr)
    
    # Get spectral rolloff
    spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
    
    print(f"  Average brightness: {np.mean(spectral_centroids):.1f} Hz")
    print(f"  Brightness range: {np.min(spectral_centroids):.1f} - {np.max(spectral_centroids):.1f} Hz")
    
    # 6. GENERATE COMPREHENSIVE DATA
    print(f"\n💻 Generating comprehensive data...")
    
    # Create comprehensive timing map with all data
    comprehensive_beats = []
    for i, beat in enumerate(beats):
        # Find closest energy peak
        closest_energy = 0.5
        for peak in energy_peaks:
            if abs(peak['time'] - beat['time']) < 0.5:  # Within 500ms
                closest_energy = peak['energy']
                break
        
        # Find current tempo
        current_bpm = len(beats) * 60 / duration  # Default
        for change in tempo_changes:
            if change['time'] <= beat['time']:
                current_bpm = change['bpm']
            else:
                break
        
        # Calculate rhythm speed (beats per second)
        rhythm_speed = 1.0 / (intervals[i-1] if i > 0 else mean_interval) if i > 0 else 1.0 / mean_interval
        
        comprehensive_beats.append({
            'time': beat['time'],
            'intensity': beat['intensity'],
            'type': beat['type'],
            'bpm': float(current_bpm),
            'rhythm_speed': float(rhythm_speed),
            'energy': float(closest_energy),
            'interval': float(intervals[i-1]) if i > 0 else float(mean_interval)
        })
    
    # Generate JavaScript code
    beat_lines = []
    for i, beat in enumerate(comprehensive_beats):
        comma = "," if i < len(comprehensive_beats) - 1 else ""
        beat_lines.append(f"    {{ time: {beat['time']:.3f}, intensity: {beat['intensity']:.3f}, type: '{beat['type']}', bpm: {beat['bpm']:.1f}, rhythm_speed: {beat['rhythm_speed']:.2f}, energy: {beat['energy']:.3f}, interval: {beat['interval']:.3f} }}{comma}")
    
    js_code = f"""// COMPREHENSIVE AUDIO ANALYSIS RESULTS
// Duration: {duration:.2f}s | Beats: {len(beats)} | Tempo Changes: {len(tempo_changes)}
// Average BPM: {len(beats) * 60 / duration:.1f} | Rhythm Consistency: {rhythm_consistency:.2f}

const timingMap = [
{chr(10).join(beat_lines)}
];

// Tempo changes throughout the track
const tempoChanges = [
{chr(10).join([f"    {{ time: {change['time']:.3f}, bpm: {change['bpm']:.1f}, change: {change['change']:.1f}, type: '{change['type']}' }}" + ("," if i < len(tempo_changes) - 1 else "") for i, change in enumerate(tempo_changes)])}
];

// Energy peaks
const energyPeaks = [
{chr(10).join([f"    {{ time: {peak['time']:.3f}, energy: {peak['energy']:.3f} }}" + ("," if i < len(energy_peaks) - 1 else "") for i, peak in enumerate(energy_peaks)])}
];

// Silent periods (no music playing)
const silentPeriods = [
{chr(10).join([f"    {{ start: {period['start']:.3f}, end: {period['end']:.3f}, duration: {period['duration']:.3f}, avgEnergy: {period['avg_energy']:.4f} }}" + ("," if i < len(silent_periods) - 1 else "") for i, period in enumerate(silent_periods)])}
];

// Analysis statistics
const audioStats = {{
    duration: {duration:.2f},
    totalBeats: {len(beats)},
    averageBPM: {len(beats) * 60 / duration:.1f},
    tempoChanges: {len(tempo_changes)},
    energyPeaks: {len(energy_peaks)},
    silentPeriods: {len(silent_periods)},
    rhythmConsistency: {rhythm_consistency:.2f},
    meanInterval: {mean_interval:.3f},
    energyRange: [{np.min(rms):.3f}, {np.max(rms):.3f}],
    silenceThreshold: {silence_threshold:.4f}
}};

// Enhanced function to get current audio state
function getCurrentAudioState(currentTime) {{
    // Find closest beat
    let closestBeat = timingMap[0];
    let minDistance = Math.abs(currentTime - closestBeat.time);
    
    for (let beat of timingMap) {{
        const distance = Math.abs(currentTime - beat.time);
        if (distance < minDistance) {{
            minDistance = distance;
            closestBeat = beat;
        }}
    }}
    
    // Find current tempo
    let currentTempo = tempoChanges[0];
    for (let tempo of tempoChanges) {{
        if (tempo.time <= currentTime) {{
            currentTempo = tempo;
        }} else {{
            break;
        }}
    }}
    
    return {{
        intensity: closestBeat.intensity,
        bpm: closestBeat.bpm,
        rhythmSpeed: closestBeat.rhythm_speed,
        energy: closestBeat.energy,
        interval: closestBeat.interval,
        tempoChange: currentTempo
    }};
}}

// Function to check if current time is in a silent period
function isInSilentPeriod(currentTime) {{
    for (let period of silentPeriods) {{
        if (currentTime >= period.start && currentTime <= period.end) {{
            return {{
                isSilent: true,
                period: period,
                timeInSilence: currentTime - period.start
            }};
        }}
    }}
    return {{ isSilent: false }};
}}

// Function to get silence information for current time
function getSilenceInfo(currentTime) {{
    return isInSilentPeriod(currentTime);
}}

console.log("Comprehensive audio analysis loaded:", audioStats);"""
    
    print("\n📋 COMPREHENSIVE ANALYSIS RESULTS:")
    print("=" * 60)
    print("✅ Generated JavaScript code for audio-analysis.js")
    print("✅ Generated JSON data for audio_analysis.json")
    print("=" * 60)
    
    # Save JavaScript code to audio-analysis.js
    with open('audio-analysis.js', 'w') as f:
        f.write(js_code)
    
    # Save JSON data to audio_analysis.json
    with open('audio_analysis.json', 'w') as f:
        json.dump({
            'beats': comprehensive_beats,
            'tempo_changes': tempo_changes,
            'energy_peaks': energy_peaks,
            'silent_periods': silent_periods,
            'stats': {
                'duration': duration,
                'total_beats': len(beats),
                'average_bpm': len(beats) * 60 / duration,
                'tempo_changes': len(tempo_changes),
                'energy_peaks': len(energy_peaks),
                'silent_periods': len(silent_periods),
                'rhythm_consistency': rhythm_consistency,
                'mean_interval': mean_interval,
                'energy_range': [float(np.min(rms)), float(np.max(rms))],
                'silence_threshold': float(silence_threshold)
            }
        }, f, indent=2)
    
    # Update the audio file path in index.html
    update_audio_file_in_html(audio_file)
    
    print(f"\n✅ Analysis complete!")
    print(f"📁 JavaScript code saved to: audio-analysis.js")
    print(f"📁 JSON data saved to: audio_analysis.json")
    print(f"📄 HTML file updated with new audio source")
    print(f"🎵 Audio file analyzed: {audio_file}")
    print(f"⏱️  Duration: {duration:.2f}s | Beats: {len(beats)} | BPM: {len(beats) * 60 / duration:.1f}")
    print(f"🔇 Silent periods: {len(silent_periods)} | Threshold: {silence_threshold:.4f}")
    
    return js_code

if __name__ == "__main__":
    import sys
    
    # Check if audio file path is provided
    if len(sys.argv) < 2:
        print("Usage: python analyze_audio.py <audio_file_path>")
        print("Example: python analyze_audio.py sound.mp3")
        print("Example: python analyze_audio.py sound_short.mp3")
        sys.exit(1)
    
    audio_file_path = sys.argv[1]
    
    # Check if file exists
    import os
    if not os.path.exists(audio_file_path):
        print(f"Error: Audio file not found at '{audio_file_path}'")
        print("Make sure the file path is correct and the file exists.")
        sys.exit(1)
    
    try:
        analyze_audio(audio_file_path)
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure you have librosa installed: pip install librosa")
        print("And that the audio file format is supported (mp3, wav, etc.)")
