document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const consumer = document.getElementById("consumer").value;
  const amount = document.getElementById("amount").value;
  const method = document.getElementById("method").value;

  await apiRequest("/payments", "POST", {
    userId: localStorage.getItem("userId"),
    consumer_number: consumer, amount, method, status: "Success"
  });

  window.location.href = "history.html";
});
