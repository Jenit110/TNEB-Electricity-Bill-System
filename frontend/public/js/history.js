async function loadHistory() {
  const userId = localStorage.getItem("userId");
  const bills = await apiRequest(`/bills/history/${userId}`);
  const payments = await apiRequest(`/payments/history/${userId}`);

  const table = document.getElementById("historyTable");
  bills.forEach(bill => {
    table.innerHTML += `<tr>
      <td>${bill.consumer_number}</td>
      <td>${bill.units_consumed}</td>
      <td>₹${bill.grand_total}</td>
      <td>${bill.calculated_on}</td>
    </tr>`;
  });

  payments.forEach(p => {
    table.innerHTML += `<tr>
      <td>${p.consumer_number}</td>
      <td>₹${p.amount}</td>
      <td>${p.method}</td>
      <td>${p.status}</td>
      <td>${p.payment_date}</td>
    </tr>`;
  });
}
loadHistory();
