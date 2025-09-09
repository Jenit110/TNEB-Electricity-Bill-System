document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const data = await apiRequest("/auth/login", "POST", { email, password }, false);

    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.user.id);
    window.location.href = "dashboard.html";
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});
