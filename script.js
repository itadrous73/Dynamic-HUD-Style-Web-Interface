document.addEventListener('DOMContentLoaded', () => {

    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');
    const weatherDisplay = document.getElementById('weather-display');
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');

    const weatherCache = new Map();
    let wakeLock = null;

    let currentScale = 1;
    let targetScale = 1;
    const easing = 0.06;

    const minScale = 0.8;
    const maxScale = 1.5;

    function updateTimeAndDate() {
        const now = new Date();
        
        // A more concise way to format 12-hour time
        const hours = String(now.getHours() % 12 || 12).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
        
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = now.toLocaleDateString('en-US', options);
    }


    function getSciFiDescription(code, temp) {
        if (temp <= 32) return 'Sub-Zero Anomaly'; // Freezing temps

        switch (code) {
            case 0: case 1: return 'No Anomalys Detected'; // Clear
            case 2: case 3: return 'High Cloud Density'; // Cloudy
            case 45: case 48: return 'Low Visibility'; // Fog
            case 51: case 53: case 55:
            case 61: case 63: case 65:
            case 80: case 81: case 82: return 'Exo-Precipitation'; // Rain
            case 66: case 67: return 'Glacial Rain Event'; // Freezing Rain
            case 71: case 73: case 75:
            case 85: case 86: return 'Crystalline Fall Detected'; // Snow
            case 95: case 96: case 99: return 'Ion Storm Approaching'; // Thunderstorm
            default: return 'Sensor Data Inconclusive';
        }
    }

    async function fetchAndDisplayWeather() {
        const locations = [
            { codename: 'Aegyptus Protectorate', lat: 30.04, lon: 31.23 },      // Egypt
            { codename: 'Mandate-Texan', lat: 30.26, lon: -97.74 },          // Texas
            { codename: 'Mi-ami Arcology', lat: 25.76, lon: -80.19 },      // Miami
            { codename: 'Neo-To-kyo', lat: 35.67, lon: 139.65 },           // Tokyo
            { codename: 'Moscow Citadel', lat: 55.75, lon: 37.61 },           // Moscow
            { codename: 'Zone Alpha-Sydney', lat: -33.86, lon: 151.20 },      // Sydney
            { codename: 'London Base 2A', lat: 51.50, lon: -0.12 },        // London
            { codename: 'Rio de-Janeiro', lat: -22.90, lon: -43.17 }     // Rio de Janeiro
        ];

        const randomLocation = locations[Math.floor(Math.random() * locations.length)];

        if (weatherCache.has(randomLocation.codename)) {
            if (Math.random() < 0.8) {
                const cachedData = weatherCache.get(randomLocation.codename);
                weatherDisplay.innerHTML = `${cachedData.temperature}°F, ${cachedData.description}<br>Location: ${randomLocation.codename}`;
                return;
            }
        }

        const latitude = randomLocation.lat;
        const longitude = randomLocation.lon;
        
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Signal Lost');
            
            const data = await response.json();
            const temperature = data.current.temperature_2m;
            const weatherCode = data.current.weather_code;
            const description = getSciFiDescription(weatherCode, temperature);
            
            const dataToCache = {
                temperature: temperature,
                description: description
            };
            weatherCache.set(randomLocation.codename, dataToCache);

            weatherDisplay.innerHTML = `${temperature}°F, ${description}<br>Location: ${randomLocation.codename}`;

        } catch (error) {
            console.error('Weather uplink failed:', error);
            weatherDisplay.innerHTML = 'WEATHER DATA CORRUPTED<br>Location: UNKNOWN';
        }
    }

    const canvasSize = 62.5;
    const scaleFactor = 3; 
    
    canvas.width = canvasSize * scaleFactor;
    canvas.height = canvasSize * scaleFactor;
    ctx.scale(scaleFactor, scaleFactor);

    const ringLineWidth = 1.5;
    const center = { x: canvasSize / 2, y: canvasSize / 2 };
    const radius = (canvasSize / 2) - (ringLineWidth / 2);
    const radiusSq = radius * radius;

    let particles = [];
    const particleCount = 23;
    const maxLineDistance = 20;
    const maxLineDistanceSq = maxLineDistance * maxLineDistance;
    
    const connectionStates = new Map();
    const FADE_EASING = 0.05;

    function updateConnections() {
        for (const state of connectionStates.values()) {
            state.targetOpacity = 0;
        }

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < maxLineDistanceSq) {
                    const key = i < j ? `${i}-${j}` : `${j}-${i}`;

                    if (connectionStates.has(key)) {
                        connectionStates.get(key).targetOpacity = 1;
                    } else {
                        connectionStates.set(key, {
                            currentOpacity: 0,
                            targetOpacity: 1
                        });
                    }
                }
            }
        }
    }

    function createParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const r = radius * Math.sqrt(Math.random()); 

            particles.push({
                x: center.x + r * Math.cos(angle),
                y: center.y + r * Math.sin(angle),
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                size: Math.random() * .1 + 0.5
            });
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvasSize, canvasSize);

        // Draw outer ring
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(248, 213, 104, 1.0)';
        ctx.lineWidth = ringLineWidth;
        ctx.stroke();
        
        // Combined loop for updating particle positions and drawing their lines to the edge
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            const vecX = p.x - center.x;
            const vecY = p.y - center.y;
            const distSq = vecX * vecX + vecY * vecY;

            // Use squared distance for collision check to avoid sqrt()
            if (distSq > radiusSq) { 
                p.vx *= -1;
                p.vy *= -1;
                p.x += p.vx; 
                p.y += p.vy;
            }

            // Draw the line to the edge (we only need sqrt() here now)
            const distFromCenter = Math.sqrt(distSq);
            const ringX = center.x + (vecX / distFromCenter) * radius;
            const ringY = center.y + (vecY / distFromCenter) * radius;
            const opacity = distFromCenter / radius;
            
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(ringX, ringY);
            ctx.strokeStyle = `rgba(248, 213, 104, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        });
        
        // Efficiently draw all particles in one go
        ctx.beginPath();
        particles.forEach(p => {
            ctx.moveTo(p.x + p.size, p.y);
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        });
        ctx.fillStyle = '#F8D568';
        ctx.fill();

        // Iterate through connections to update and draw them
        connectionStates.forEach((state, key) => {
            state.currentOpacity += (state.targetOpacity - state.currentOpacity) * FADE_EASING;

            if (state.targetOpacity === 0 && state.currentOpacity < 0.01) {
                connectionStates.delete(key);
                return;
            }

            const [i, j] = key.split('-').map(Number);
            const p1 = particles[i];
            const p2 = particles[j];
            
            if (!p1 || !p2) {
                connectionStates.delete(key);
                return;
            }

            // OPTIMIZATION: Calculate opacity using squared distance to avoid sqrt().
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distSq = dx * dx + dy * dy;
            const distanceOpacity = Math.max(0, (1 - distSq / maxLineDistanceSq));

            const finalOpacity = state.currentOpacity * distanceOpacity * 0.9;
            
            if (finalOpacity > 0.01) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `rgba(248, 213, 104, ${finalOpacity})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        });

        // Animate canvas scale
        if (Math.random() < 0.01) {
            const randomBias = Math.max(Math.random(), Math.random());
            targetScale = minScale + (maxScale - minScale) * randomBias;
        }
        currentScale += (targetScale - currentScale) * easing;
        canvas.style.transform = `translate(-50%, -50%) scale(${currentScale})`;

        requestAnimationFrame(animateParticles);
    }
    
    const toggleWakeLock = async () => {
        if (!('wakeLock' in navigator)) return;
        try {
            if (document.fullscreenElement) {
                wakeLock = await navigator.wakeLock.request('screen');
            } else if (wakeLock) {
                await wakeLock.release();
                wakeLock = null;
            }
        } catch (err) {
            console.error(`Wake Lock error: ${err.name}, ${err.message}`);
        }
    };

    // --- Initialization ---
    updateTimeAndDate();
    setInterval(updateTimeAndDate, 1000);

    fetchAndDisplayWeather();
    setInterval(fetchAndDisplayWeather, 10000); 

    createParticles();
    
    updateConnections();
    setInterval(updateConnections, 4000);
    
    animateParticles();

    document.documentElement.addEventListener('click', () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        }
    });
    document.addEventListener('fullscreenchange', toggleWakeLock);
    document.addEventListener('visibilitychange', toggleWakeLock);
});
