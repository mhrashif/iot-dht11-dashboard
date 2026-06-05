const API_URL =
  "https://ysoizoyubokwsrzngxye.supabase.co/rest/v1/sensor_data?select=*";

const API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzb2l6b3l1Ym9rd3Nyem5neHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDQzMzAsImV4cCI6MjA5NjIyMDMzMH0.gqNGF60mCfD1krIhVGvMgzkVXWQKSn7Ru_-9iwOd6d0";

let chart;

document.getElementById("tanggal").innerHTML = new Date().toLocaleDateString(
  "id-ID",
  {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  },
);

async function loadData() {
  const response = await fetch(API_URL, {
    headers: {
      apikey: API_KEY,
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  const data = await response.json();

  if (data.length === 0) return;

  data.sort((a, b) => a.id - b.id);

  const latest = data[data.length - 1];

  const lastTime = new Date(latest.created_at);

  const now = new Date();

  const diff = (now - lastTime) / 1000;

  const statusBox = document.getElementById("statusBox");

  if (diff < 30) {
    statusBox.innerHTML = "🟢 Online";

    statusBox.className = "status online";
  } else {
    statusBox.innerHTML = "🔴 Offline";

    statusBox.className = "status offline";
  }

  document.getElementById("suhu").innerHTML = latest.suhu;

  const alarm = document.getElementById("alarmBox");

  if (latest.suhu > 35) {
    alarm.innerHTML = "⚠ HIGH TEMPERATURE";

    alarm.className = "alarm";
  } else {
    alarm.innerHTML = "";
  }

  document.getElementById("hum").innerHTML = latest.kelembapan;

  const labels = data.map((item) => {
    let t = new Date(item.created_at);

    return t.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  const suhuData = data.map((item) => item.suhu);

  const humData = data.map((item) => item.kelembapan);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("myChart"), {
    type: "line",

    data: {
      labels: labels,

      datasets: [
        {
          label: "Suhu (°C)",
          data: suhuData,
          yAxisID: "y",
          tension: 0.3,
        },
        {
          label: "Kelembapan (%)",
          data: humData,
          yAxisID: "y1",
          tension: 0.3,
        },
      ],
    },

    options: {
      responsive: true,

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
}

loadData();

setInterval(loadData, 5000);
