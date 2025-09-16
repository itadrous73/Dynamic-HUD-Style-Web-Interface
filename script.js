document.addEventListener('DOMContentLoaded', () => {

    // --- Element References ---
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');
    const weatherDisplay = document.getElementById('weather-display');

    // --- Time and Date Function ---
    function updateTimeAndDate() {
        const now = new Date();

        // Format Time (HH:MM:SS)
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;

        // Format Date
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = now.toLocaleDateString('en-US', options);
    }

    // --- Random Weather Function ---
    function setRandomWeatherData() {
        const descriptions = [
            'Ion Storm Approaching',
            'Clear Skies',
            'High Solar Winds',
            'Meteor Shower',
            'Atmospheric Anomaly',
            'Sub-Zero Anomaly'
        ];
        const locations = [
            'Sector 7-G',
            'Mars Colony',
            'Neo-Amsterdam',
            'Alpha Centauri',
            'Titan Outpost'
        ];

        // Generate random data
        const randomTemp = Math.floor(Math.random() * 65) - 20; // Temp between -20 and 45
        const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
        const randomLoc = locations[Math.floor(Math.random() * locations.length)];

        // Format and display the random report
        weatherDisplay.innerHTML = `${randomTemp}°C, ${randomDesc}<br>Location: ${randomLoc}`;
    }


    // --- Initial Calls & Intervals ---

    // Update time immediately and then every second
    updateTimeAndDate();
    setInterval(updateTimeAndDate, 1000);

    // Set the random weather data immediately on load
    setRandomWeatherData();
    // And then update the weather every 10 seconds (10000 milliseconds)
    setInterval(setRandomWeatherData, 10000);
});