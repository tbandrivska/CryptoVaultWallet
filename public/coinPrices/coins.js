

export async function fetchCoinPrice() {
    const container = document.getElementById('priceContainer');
    const walletVal = document.getElementById('walletValue');
    const apiKey = 'CG-2UhE78yESRWdrAX3pU6fMsCZ';
    const API_URL = 'https://api.coingecko.com/api/v3/coins/markets';
    
    const walletBalance = 100; 
    const coinType = 'bitcoin'; 

    try {
        const params = new URLSearchParams({
            vs_currency: 'gbp',
            order: 'market_cap_desc', // We get top by market cap, then sort by price
            per_page: '20',
            page: '1',
            sparkline: 'false',
            price_change_percentage: '24h'
        });

        const response = await fetch(`${API_URL}?${params}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'x-cg-demo-api-key': apiKey
            }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        // --- SORT BY PRICE (Highest to Lowest) ---
        data.sort((a, b) => b.current_price - a.current_price);

        // Update Wallet Value in Header
        const coin = data.find(c => c.id === coinType);

        if (coin) {
            const walletValue = walletBalance * coin.current_price;
            walletVal.innerHTML = `Wallet Value: £${walletValue.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        }


        // Clear and Rebuild Sidebar
    container.innerHTML = ''; 

    data.forEach(coin => {
        // 1. Create the 'box' (the div)
        const card = document.createElement('div');
        card.className = 'coin-card';

        // 2. Add the HTML inside the box
        const changeColor = coin.price_change_percentage_24h >= 0 ? 'trend-up' : 'trend-down';
        const symbol = coin.price_change_percentage_24h >= 0 ? '▲' : '▼';

        card.innerHTML = `
            <div class="coin-main">
                <img src="${coin.image}" class="coin-logo" alt="${coin.name}">
                <div class="coin-info">
                    <span class="coin-name">${coin.name}</span>
                    <span class="coin-price">£${coin.current_price.toLocaleString()}</span>
                </div>
            </div>
            <div class="coin-trend ${changeColor}">
                ${symbol}${Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
            </div>
        `;

        // 3. ATTACH THE CLICK EVENT (This replaces 'onclick' in HTML)
        card.addEventListener('click', () => {
            console.log("Clicked:", coin.id); // For debugging
            renderChart(coin.id); 
        });

        // 4. Put the card into the sidebar
        container.appendChild(card);
    });

    } catch (err) {
        console.error("Error:", err);
        container.innerHTML = "Error loading prices.";
    }
}

let myChart = null;

export async function renderChart(coinId = 'bitcoin') {
    const ctx = document.getElementById('coinChart').getContext('2d');
    
    // 2. CHECK AND DESTROY
    if (myChart) {
        myChart.destroy();
    }

    const apiKey = 'CG-2UhE78yESRWdrAX3pU6fMsCZ';
    const API_URL = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=gbp&days=7`;

    try {
        const response = await fetch(API_URL, {
            headers: { 'x-cg-demo-api-key': apiKey }
        });
        const data = await response.json();

        const labels = data.prices.map(p => new Date(p[0]).toLocaleDateString());
        const prices = data.prices.map(p => p[1]);

        // 3. Assign the new chart to our variable
        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${coinId.toUpperCase()} Price (7 Days)`,
                    data: prices,
                    borderColor: '#48d1cc',
                    tension: 0.3,
                    fill: true,
                    backgroundColor: 'rgba(72, 209, 204, 0.1)',
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false // Allows you to control size via CSS
            }
        });
    } catch (err) {
        console.error("Chart Error:", err);
    }
}