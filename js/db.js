// API Wrapper for Deno Backend

class Database {
    async init() {
        console.log("API Database Initialized");
        return true;
    }

    async request(url, options = {}, retries = 3) {
        options.headers = options.headers || {};
        options.headers['Bypass-Tunnel-Reminder'] = 'true';
        
        for (let i = 0; i < retries; i++) {
            try {
                const res = await fetch(url, options);
                if (res.ok) {
                    return res;
                }
                if (res.status !== 502 && res.status !== 504) {
                    throw new Error(`HTTP error: ${res.status}`);
                }
            } catch (err) {
                if (i === retries - 1) throw err;
            }
            // Wait 500ms before retrying
            await new Promise(r => setTimeout(r, 500));
        }
        throw new Error('Max retries reached');
    }

    async add(collectionName, data) {
        const res = await this.request(`/api/${collectionName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        return result.id;
    }

    async setWithId(collectionName, id, data) {
        const res = await this.request(`/api/${collectionName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...data })
        });
        return id;
    }

    async update(collectionName, id, data) {
        await this.request(`/api/${collectionName}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return true;
    }

    async getAll(collectionName) {
        const res = await this.request(`/api/${collectionName}`);
        return await res.json();
    }

    async getById(collectionName, id) {
        const res = await this.request(`/api/${collectionName}?id=${id}`);
        return await res.json();
    }

    async getByField(collectionName, field, value) {
        const res = await this.request(`/api/${collectionName}?${field}=${encodeURIComponent(value)}`);
        return await res.json();
    }

    async delete(collectionName, id) {
        await this.request(`/api/${collectionName}?id=${id}`, {
            method: 'DELETE'
        });
        return true;
    }

    async getRecordsWithDetails(filterStatus = null, supervisorId = null, engineerId = null, dateRange = null) {
        let res = await this.request('/api/allRecordsDetails');
        let records = await res.json();
        
        if (filterStatus) records = records.filter(r => r.status === filterStatus);
        if (supervisorId) records = records.filter(r => String(r.supervisorId) === String(supervisorId));
        if (engineerId) records = records.filter(r => String(r.engineerId) === String(engineerId));

        if (dateRange && dateRange.start && dateRange.end) {
            records = records.filter(r => r.date >= dateRange.start && r.date <= dateRange.end);
        }

        return records.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}

const db = new Database();
