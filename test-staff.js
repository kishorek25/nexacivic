async function testStatusUpdate() {
    try {
        console.log("Logging in as staff...");
        const loginRes = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'staff1@nexacivic.com', password: 'admin123' })
        });
        
        if (!loginRes.ok) throw new Error("Login failed");
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Logged in. Token:", token.substring(0, 20) + '...');

        console.log("Fetching complaints...");
        const compRes = await fetch('http://localhost:5000/api/complaints', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!compRes.ok) throw new Error("Fetch failed");
        const complaints = await compRes.json();
        console.log(`Found ${complaints.length} complaints assigned to staff.`);

        if (complaints.length === 0) {
            console.log("No complaints assigned to this staff. Cannot test.");
            return;
        }

        const complaint = complaints[0];
        console.log(`Updating status of complaint ${complaint._id} ('${complaint.title}') to 'In Progress'...`);
        
        const updateRes = await fetch(`http://localhost:5000/api/complaints/${complaint._id}/status`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'In Progress' })
        });
        
        const updateData = await updateRes.json();
        console.log("Status update response status:", updateRes.status);
        console.log("Update response data:", updateData);

    } catch (err) {
        console.error("Script error:", err);
    }
}

testStatusUpdate();
