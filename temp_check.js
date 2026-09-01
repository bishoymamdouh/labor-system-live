
        window.onerror = function(msg, url, lineNo, columnNo, error) {
            const errStr = `Error: ${msg}\nURL: ${url}\nLine: ${lineNo}:${columnNo}\nStack: ${error ? error.stack : ''}`;
            alert(errStr);
            fetch('/api/logs', { method: 'POST', body: JSON.stringify({ error: errStr }) });
            return false;
        };
        
        function customSort(a, b, isUser = false) {
            let nameA = (isUser ? a.username : a.name) || "";
            let nameB = (isUser ? b.username : b.name) || "";

            if (isUser && nameA === 'admin') return -1;
            if (isUser && nameB === 'admin') return 1;

            const isArabicA = /[\u0600-\u06FF]/.test(nameA);
            const isArabicB = /[\u0600-\u06FF]/.test(nameB);

            if (isArabicA && !isArabicB) return 1;
            if (!isArabicA && isArabicB) return -1;

            return nameA.localeCompare(nameB, 'ar');
        }

        window.onunhandledrejection = function(event) {
            const errStr = `Unhandled Promise: ${event.reason}`;
            console.error(errStr);
            fetch('/api/logs', { method: 'POST', body: JSON.stringify({ error: errStr }) }).catch(() => {});
        };
    