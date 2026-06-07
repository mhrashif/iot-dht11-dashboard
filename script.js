const API_URL =
  "https://ysoizoyubokwsrzngxye.supabase.co/rest/v1/sensor_data?select=*&order=id.desc&limit=100";

const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzb2l6b3l1Ym9rd3Nyem5neHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDQzMzAsImV4cCI6MjA5NjIyMDMzMH0.gqNGF60mCfD1krIhVGvMgzkVXWQKSn7Ru_-9iwOd6d0";

let chart;
let dataGlobal = [];

// ======================
// TANGGAL
// ======================

document.getElementById("tanggal").innerHTML = new Date().toLocaleDateString(
  "id-ID",
  {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  },
);

// ======================
// DARK MODE
// ======================

const themeToggle = document.getElementById("themeToggle");

themeToggle.onclick = () => {
  document.body.classList.toggle("dark");

  localStorage.setItem("theme", document.body.classList.contains("dark"));
};

if (localStorage.getItem("theme") === "true") {
  document.body.classList.add("dark");
}

// ======================
// LOAD DATA
// ======================

async function loadData(limit = 100) {
  try {
    const response = await fetch(API_URL, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    const data = await response.json();

    if (!data.length) return;

    data.sort((a, b) => a.id - b.id);

    dataGlobal = data;

    const latest = data[data.length - 1];

    // ======================
    // CARD UTAMA
    // ======================

    document.getElementById("suhu").innerHTML = Number(latest.suhu).toFixed(1);

    document.getElementById("hum").innerHTML = Number(
      latest.kelembapan,
    ).toFixed(1);

    // ======================
    // MAX & MIN
    // ======================

    const temps = data.map((d) => Number(d.suhu));

    document.getElementById("maxTemp").innerHTML = Math.max(...temps).toFixed(
      1,
    );

    document.getElementById("minTemp").innerHTML = Math.min(...temps).toFixed(
      1,
    );

    // ======================
    // LAST UPDATE
    // ======================

    const lastTime = new Date(latest.created_at);

    document.getElementById("lastUpdate").innerHTML =
      "Last Update : " + lastTime.toLocaleTimeString("id-ID");

    // ======================
    // ONLINE OFFLINE
    // ======================

    const diff = (Date.now() - lastTime.getTime()) / 1000;

    const statusBox = document.getElementById("statusBox");

    const systemState = document.getElementById("systemState");

    if (diff < 30) {
      statusBox.innerHTML = "🟢 Online";

      statusBox.className = "status online";

      systemState.innerHTML = "✔ Normal Operation";
    } else {
      statusBox.innerHTML = "🔴 Offline";

      statusBox.className = "status offline";

      systemState.innerHTML = "⚠ Device Offline";
    }

    // ======================
    // ALARM
    // ======================

    const alarm = document.getElementById("alarmBox");

    if (latest.suhu > 35) {
      alarm.innerHTML = "⚠ HIGH TEMPERATURE DETECTED";

      alarm.className = "alarm";
    } else {
      alarm.innerHTML = "";
      alarm.className = "";
    }

    // ======================
    // CHART
    // ======================

    const labels = data.map((item) => {
      return new Date(item.created_at).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    });

    const suhuData = data.map((item) => Number(item.suhu));

    const humData = data.map((item) => Number(item.kelembapan));

    if (chart) {
      chart.destroy();
    }

    chart = new Chart(document.getElementById("myChart"), {
      type: "line",

      data: {
        labels: labels,

        datasets: [
          {
            label: "Suhu (°C)",
            data: suhuData,
            yAxisID: "y",
            borderWidth: 3,
            tension: 0.3,
          },

          {
            label: "Kelembapan (%)",
            data: humData,
            yAxisID: "y1",
            borderWidth: 3,
            tension: 0.3,
          },
        ],
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        interaction: {
          mode: "index",
          intersect: false,
        },

        scales: {
          y: {
            type: "linear",

            position: "left",

            title: {
              display: true,
              text: "Suhu (°C)",
            },
          },

          y1: {
            type: "linear",

            position: "right",

            grid: {
              drawOnChartArea: false,
            },

            title: {
              display: true,
              text: "Kelembapan (%)",
            },
          },
        },
      },
    });

    // ======================
    // TABLE
    // ======================

    const table = document.getElementById("latestTable");

    if (table) {
      table.innerHTML = "";

      data
        .slice(-10)
        .reverse()
        .forEach((row) => {
          table.innerHTML += `
          <tr>
            <td>
              ${new Date(row.created_at).toLocaleTimeString()}
            </td>
            <td>${row.suhu}</td>
            <td>${row.kelembapan}</td>
          </tr>
          `;
        });
    }
  } catch (error) {
    console.error(error);
  }
}

// ======================
// EXPORT CSV
// ======================

const exportBtn = document.getElementById("exportBtn");

if (exportBtn) {
  exportBtn.onclick = () => {
    let csv = "Time,Suhu,Kelembapan\n";

    dataGlobal.forEach((r) => {
      csv += `${r.created_at},${r.suhu},${r.kelembapan}\n`;
    });

    const blob = new Blob([csv], {
      type: "text/csv",
    });

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);

    a.download = "sensor_data.csv";

    a.click();
  };
}

// ======================
// START
// ======================

loadData();

setInterval(loadData, 5000);
