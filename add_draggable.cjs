const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const draggableScript = `
<script>
    document.addEventListener("DOMContentLoaded", () => {
        const btn = document.getElementById('floating-refresh');
        if (!btn) return;
        
        // Restore position
        const savedPos = localStorage.getItem('refreshBtnPos');
        if (savedPos) {
            const pos = JSON.parse(savedPos);
            btn.style.left = pos.left;
            btn.style.top = pos.top;
        }

        let isDragging = false;
        let startX, startY;
        let hasMoved = false;

        const startDrag = (e) => {
            isDragging = true;
            hasMoved = false;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = clientX - btn.offsetLeft;
            startY = clientY - btn.offsetTop;
            btn.style.transition = 'none';
        };

        const drag = (e) => {
            if (!isDragging) return;
            hasMoved = true;
            if (e.cancelable) e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            let newLeft = clientX - startX;
            let newTop = clientY - startY;
            
            // Constrain to window bounds
            const maxX = window.innerWidth - btn.offsetWidth;
            const maxY = window.innerHeight - btn.offsetHeight;
            
            if (newLeft < 0) newLeft = 0;
            if (newTop < 0) newTop = 0;
            if (newLeft > maxX) newLeft = maxX;
            if (newTop > maxY) newTop = maxY;
            
            btn.style.left = newLeft + 'px';
            btn.style.top = newTop + 'px';
        };

        const stopDrag = (e) => {
            if (!isDragging) return;
            isDragging = false;
            btn.style.transition = 'top 0.3s, left 0.3s';
            localStorage.setItem('refreshBtnPos', JSON.stringify({
                left: btn.style.left,
                top: btn.style.top
            }));
        };

        btn.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag, {passive: false});
        document.addEventListener('mouseup', stopDrag);
        
        btn.addEventListener('touchstart', startDrag, {passive: true});
        document.addEventListener('touchmove', drag, {passive: false});
        document.addEventListener('touchend', stopDrag);
        
        btn.onclick = (e) => {
            if (hasMoved) {
                e.preventDefault();
                e.stopPropagation();
            } else {
                location.reload();
            }
        };
    });
</script>
`;

if (!html.includes('refreshBtnPos')) {
    html = html.replace('</body>', draggableScript + '\n</body>');
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("Draggable logic added!");
} else {
    console.log("Draggable logic already exists.");
}
