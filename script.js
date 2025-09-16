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
    const easing = 0.03;

    const minScale = 0.8;
    const maxScale = 1.5;

    function updateTimeAndDate() {
        const now = new Date();
        
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        hours = hours % 12;
        hours = hours ? hours : 12; 
        
        const hoursStr = String(hours).padStart(2, '0');
        
        timeDisplay.textContent = `${hoursStr}:${minutes}:${seconds}`;
        
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

    let particles = [];
    const particleCount = 23;
    const maxLineDistance = 20;
    const maxLineDistanceSq = maxLineDistance * maxLineDistance;
    
    let connectedParticles = [];

    function updateConnections() {
        connectedParticles = [];
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distSq = dx * dx + dy * dy;

                if (distSq < maxLineDistanceSq) {
                    connectedParticles.push({ p1: i, p2: j });
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

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            const distFromCenter = Math.sqrt((p.x - center.x)**2 + (p.y - center.y)**2);
            if (distFromCenter + p.size > radius) { 
                p.vx *= -1;
                p.vy *= -1;
                p.x += p.vx; 
                p.y += p.vy;
            }
        });

        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(248, 213, 104, 1.0)';
        ctx.lineWidth = ringLineWidth;
        ctx.stroke();
        
        particles.forEach(p => {
            const distFromCenter = Math.sqrt((p.x - center.x)**2 + (p.y - center.y)**2);
            const vecX = p.x - center.x;
            const vecY = p.y - center.y;
            const ringX = center.x + (vecX / distFromCenter) * radius;
            const ringY = center.y + (vecY / distFromCenter) * radius;
            const opacity = (distFromCenter / radius) * 1.0;
            
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(ringX, ringY);
            ctx.strokeStyle = `rgba(248, 213, 104, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        });
        
        ctx.beginPath();
        particles.forEach(p => {
            ctx.moveTo(p.x + p.size, p.y);
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        });
        ctx.fillStyle = '#F8D568';
        ctx.fill();

        connectedParticles.forEach(pair => {
            const p1 = particles[pair.p1];
            const p2 = particles[pair.p2];
            
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < maxLineDistanceSq) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                
                const distance = Math.sqrt(distSq);
                const opacity = (1 - distance / maxLineDistance) * 0.9;

                ctx.strokeStyle = `rgba(248, 213, 104, ${opacity})`;
                ctx.lineWidth = 0.5;
                
                ctx.stroke();
            }
        });

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

    updateTimeAndDate();
    setInterval(updateTimeAndDate, 1000);

    fetchAndDisplayWeather();
    setInterval(fetchAndDisplayWeather, 10000); 

    createParticles();
    
    updateConnections();
    setInterval(updateConnections, 1000);
    
    animateParticles();

    document.documentElement.addEventListener('click', () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        }
    });
	document.addEventListener('fullscreenchange', toggleWakeLock);
	document.addEventListener('visibilitychange', toggleWakeLock);
});
