/*
 Almario, Via Ysabelle B.        
 BSIT-3A		Dec. 19, 2025
*/

let rawData = [];
let charts = {};

Papa.parse("comprehensive_ph_recovery_data.csv", { //Merged dataset
    download: true, 
    header: true, 
    dynamicTyping: true,
    complete: function(results) {
        rawData = results.data.filter(d => d.date);
        
        //Default Filter: Starts at Jan 2022 (Recovery Phase)
        const latestDate = rawData[rawData.length - 1].date;
        document.getElementById('start-date').value = "2022-01-01";
        document.getElementById('end-date').value = latestDate;
        
        updateDashboard();
    }
});

document.getElementById('apply-filter').addEventListener('click', updateDashboard);

function updateDashboard() {
    const start = document.getElementById('start-date').value;
    const end = document.getElementById('end-date').value;
    const filtered = rawData.filter(d => d.date >= start && d.date <= end);
    
    if (filtered.length === 0) return;
    const latest = filtered[filtered.length - 1];

    //Update KPI
    document.getElementById('stat-recovered').innerText = latest.total_recovered.toLocaleString();

    //Analyze Cluster Status: Check average new cases in selected period
    const avgCases = filtered.reduce((acc, d) => acc + (d.daily_new_cases || 0), 0) / filtered.length;
    const statusEl = document.getElementById('cluster-status');
        //Update Status
    if (avgCases > 1500) {
        statusEl.innerText = "Active Clusters";
        statusEl.style.color = "#fc8181";
    } else {
        statusEl.innerText = "Stable / Recovery";
        statusEl.style.color = "#68d391";
    }

    //Chart 1: Vaccination vs. Infection Clusters [Axis Line Chart]
    renderChart('lineChart', 'line', {
        labels: filtered.map(d => d.date),
        datasets: [
            { 
                label: 'Infection Clusters (New Cases)', 
                data: filtered.map(d => d.daily_new_cases), 
                borderColor: '#e53e3e', backgroundColor: 'rgba(229, 62, 62, 0.1)', fill: true 
            },
            { 
                label: 'Daily Vaccinations', 
                data: filtered.map(d => d.daily_vaccinations), 
                borderColor: '#3182ce', borderDash: [5, 5] 
            }
        ]
    });

    //Chart 2: Mortality [Bar Chart]
    renderChart('barChart', 'bar', {
        labels: filtered.slice(-14).map(d => d.date),
        datasets: [{ 
            label: 'Daily Deaths', 
            data: filtered.slice(-14).map(d => d.daily_new_deaths), 
            backgroundColor: '#2d3748' 
        }]
    });

    //Chart 3: Immunity (Vaccinated vs Unvaccinated) [Pie Chart]
    renderChart('pieChart', 'pie', {
        labels: ['Fully Vaccinated', 'Unprotected'],
        datasets: [{
            data: [latest.people_fully_vaccinated, 110000000 - latest.people_fully_vaccinated],
            backgroundColor: ['#398facff', '#a7c6d7ff']
        }]
    });
}

function renderChart(id, type, data) {
    if (charts[id]) charts[id].destroy();
    const ctx = document.getElementById(id).getContext('2d');
    charts[id] = new Chart(ctx, {
        type: type,
        data: data,
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } }
        }
    });
}