async function testApi() {
    try {
        console.log("1. Logging in as admin...");
        const loginRes = await fetch("http://localhost:5000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "admin@nexacivic.com", password: "admin123" })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("✅ Logged in! Token:", token.substring(0, 20) + "...");

        console.log("2. Submitting complaint...");
        const formData = new FormData();
        formData.append("title", "Test Title");
        formData.append("description", "Test Description");
        formData.append("location", "Test Location");
        formData.append("category", "Road");

        const res = await fetch("http://localhost:5000/api/complaints", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        const text = await res.text();
        console.log("✅ Response HTTP Status:", res.status);
        console.log("✅ Response Body:", text);
    } catch (err) {
        console.log("❌ Execution Failed:", err.message);
    }
}

testApi();
