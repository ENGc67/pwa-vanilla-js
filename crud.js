import { supabase } from "./supabase.js";

const tableBody = document.getElementById("tableBody");

/* ================= LOAD DATA ================= */
window.loadData = async () => {
  tableBody.innerHTML = `<tr><td colspan="3">Loading...</td></tr>`;

  const { data, error } = await supabase
    .from("ID")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    tableBody.innerHTML = `<tr><td colspan="3">${error.message}</td></tr>`;
    return;
  }

  tableBody.innerHTML = "";

  data.forEach((row, index) => {
    tableBody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${row.NAME}</td>
        <td>${new Date(row.created_at).toLocaleString()}</td>
      </tr>
    `;
  });
};

/* ================= ADD ITEM (MODAL) ================= */
window.addItem = async () => {
  const nameInput = document.getElementById("itemName");
  const message = document.getElementById("modalMessage");
  const name = nameInput.value.trim();

  if (!name) {
    message.textContent = "❗ กรุณาใส่ชื่อ";
    return;
  }

  message.textContent = "⏳ Saving...";

  const { error } = await supabase
    .from("ID")
    .insert([{ NAME: name }]);

  if (error) {
    message.textContent = "❌ " + error.message;
    return;
  }

  nameInput.value = "";
  message.textContent = "";

  bootstrap.Modal
    .getInstance(document.getElementById("addModal"))
    .hide();

  loadData();
};

/* ================= EXPORT CSV ================= */
window.exportCSV = async () => {
  const { data, error } = await supabase
    .from("ID")
    .select("*");

  if (error) {
    alert(error.message);
    return;
  }

  if (!data.length) {
    alert("No data");
    return;
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => `"${row[h] ?? ""}"`).join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "data.csv";
  a.click();

  URL.revokeObjectURL(url);
};

/* ================= AUTO LOAD ================= */
document.addEventListener("DOMContentLoaded", loadData);
