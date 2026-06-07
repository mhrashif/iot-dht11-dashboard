const BASE_URL = "https://ysoizoyubokwsrzngxye.supabase.co/rest/v1/sensor_data";

const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzb2l6b3l1Ym9rd3Nyem5neHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDQzMzAsImV4cCI6MjA5NjIyMDMzMH0.gqNGF60mCfD1krIhVGvMgzkVXWQKSn7Ru_-9iwOd6d0";

let chart;
let dataGlobal = [];

let currentFilter = "1h";

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

async function loadData(filter = currentFilter) {
  currentFilter = filter;

  let startTime;

  switch (filter) {
    case "1h":
      startTime = new Date(Date.now() - 1 * 60 * 60 * 1000);
      break;

    case "6h":
      startTime = new Date(Date.now() - 6 * 60 * 60 * 1000);
      break;

    case "24h":
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      break;

    default:
      startTime = new Date(Date.now() - 1 * 60 * 60 * 1000);
  }

  const url = `${BASE_URL}?select=*&order=id.desc&limit=100`;

  try {
    const response = await fetch(url, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    const data = await response.json();
    console.log("Filter:", filter);
    console.log("Jumlah data:", data.length);

    if (!data.length) return;

    data.sort((a, b) => a.id - b.id);

    dataGlobal = data;

    const latest = data[data.length - 1];

    let env = "GOOD";

    if (Number(latest.suhu) > 35) {
      env = "POOR";
    } else if (Number(latest.suhu) > 30) {
      env = "WARNING";
    }

    document.getElementById("envStatus").innerHTML = env;

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

    const hums = data.map((d) => Number(d.kelembapan));

    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;

    const avgHum = hums.reduce((a, b) => a + b, 0) / hums.length;

    document.getElementById("avgTemp").innerHTML = avgTemp.toFixed(1);

    document.getElementById("avgHum").innerHTML = avgHum.toFixed(1);

    document.getElementById("totalRecords").innerHTML = data.length;

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

    document.getElementById("dataAge").innerHTML =
      "Data Age : " + Math.floor(diff) + " sec";

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
    if (Number(latest.suhu) > 35) {
      alarm.innerHTML = "🔴 CRITICAL TEMPERATURE";

      alarm.className = "alarm-danger";
    } else if (Number(latest.suhu) > 30) {
      alarm.innerHTML = "🟡 WARNING TEMPERATURE";

      alarm.className = "alarm-warning";
    } else {
      alarm.innerHTML = "🟢 NORMAL";

      alarm.className = "alarm-normal";
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

<td>
${row.suhu > 35 ? "Critical" : row.suhu > 30 ? "Warning" : "Normal"}
</td>
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

loadData("1h");

setInterval(() => {
  loadData(currentFilter);
}, 5000);
