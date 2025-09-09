async function saveBill(first, second, units, total) {
  const userId = localStorage.getItem("userId");
  await apiRequest("/bills/calculate", "POST", {
    userId, first_reading: first, second_reading: second,
    units_consumed: units, grand_total: total
  });
}
