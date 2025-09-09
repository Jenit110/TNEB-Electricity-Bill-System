async function loadProfile() {
  const userId = localStorage.getItem("userId");
  const user = await apiRequest(`/users/${userId}`);
  document.getElementById("name").value = user.name;
  document.getElementById("email").value = user.email;
  document.getElementById("phone").value = user.phone;
}

async function updateProfile() {
  const userId = localStorage.getItem("userId");
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;

  await apiRequest(`/users/${userId}`, "PUT", { name, email, phone });
  alert("Profile updated ✅");
}
