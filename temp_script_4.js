
    (function() {
        const btn = document.getElementById('draggable-refresh-btn');
        let isDragging = false;
        let hasDragged = false;
        let startX, startY, initialX, initialY;

        // Load saved position
        const savedPos = localStorage.getItem('labor_app_refresh_btn_pos');
        if (savedPos) {
            const pos = JSON.parse(savedPos);
            btn.style.left = pos.left;
            btn.style.top = pos.top;
        }

        function startDrag(e) {
            isDragging = true;
            hasDragged = false;
            btn.style.cursor = 'grabbing';
            btn.style.transform = 'scale(1.1)';
            
            if (e.type === 'touchstart') {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            } else {
                startX = e.clientX;
                startY = e.clientY;
            }
            
            initialX = btn.offsetLeft;
            initialY = btn.offsetTop;
        }

        function drag(e) {
            if (!isDragging) return;
            e.preventDefault();
            
            let currentX, currentY;
            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX;
                currentY = e.touches[0].clientY;
            } else {
                currentX = e.clientX;
                currentY = e.clientY;
            }

            const dx = currentX - startX;
            const dy = currentY - startY;
            
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                hasDragged = true;
            }

            btn.style.left = (initialX + dx) + 'px';
            btn.style.top = (initialY + dy) + 'px';
        }

        function stopDrag(e) {
            if (!isDragging) return;
            isDragging = false;
            btn.style.cursor = 'grab';
            btn.style.transform = 'scale(1)';
            
            if (!hasDragged) {
                // If it was just a click (no drag), do the refresh
                btn.querySelector('i').classList.add('fa-spin');
                window.location.reload();
            } else {
                // Save new position
                localStorage.setItem('labor_app_refresh_btn_pos', JSON.stringify({
                    left: btn.style.left,
                    top: btn.style.top
                }));
            }
        }

        btn.addEventListener('mousedown', startDrag);
        window.addEventListener('mousemove', drag, { passive: false });
        window.addEventListener('mouseup', stopDrag);

        btn.addEventListener('touchstart', startDrag, { passive: false });
        window.addEventListener('touchmove', drag, { passive: false });
        window.addEventListener('touchend', stopDrag);
    })();
