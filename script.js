// --- Tab Switching & Dynamic Expansion ---
function switchTab(tabId, event) {
    const widget = document.querySelector('.wetransfer-widget');
    
    if (tabId === 'calculator') {
        widget.classList.add('expanded');
    } else {
        widget.classList.remove('expanded');
    }

    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    const targetContent = document.getElementById(tabId);
    if (targetContent) targetContent.classList.add('active');

    navLinks.forEach(link => {
        if (link.getAttribute('onclick')?.includes(`'${tabId}'`)) {
            link.classList.add('active');
        }
    });

    if (tabId === 'calculator') {
        setTimeout(updateAll, 100);
    }
}

// --- Background Slideshow ---
let currentSlide = 0;
function initSlideshow() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;

    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000);
}

// --- Advanced Calculator Logic ---
let sideCtx, frontCtx;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const daysInYear = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349];
const lat = 36.0;

function formatTime(decHour) {
    const h = Math.floor(decHour);
    const m = Math.round((decHour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function getSunPos(day, hour) {
    const decRad = 23.45 * Math.sin((360 / 365) * (day - 81) * Math.PI / 180) * Math.PI / 180;
    const latRad = lat * Math.PI / 180;
    const hRad = 15 * (hour - 12) * Math.PI / 180;
    const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(hRad);
    const altRad = Math.asin(sinAlt);
    const alt = altRad * 180 / Math.PI;
    let cosAz = (Math.sin(latRad) * sinAlt - Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(altRad));
    cosAz = Math.max(-1, Math.min(1, cosAz));
    let azRad = Math.acos(cosAz);
    if (hour < 12) azRad = -azRad;
    const az = azRad * 180 / Math.PI;
    return { alt, az };
}

function getObstructionAngles(L, W, dist, hgt, pos) {
    let xStart = 0, xEnd = 0;
    if (pos === 'left') { xStart = -L / 2; xEnd = -L / 2 + W; }
    else if (pos === 'right') { xStart = L / 2 - W; xEnd = L / 2; }
    else if (pos === 'center') { xStart = -W / 2; xEnd = W / 2; }
    
    const ang1 = Math.atan2(xStart, dist) * 180 / Math.PI;
    const ang2 = Math.atan2(xEnd, dist) * 180 / Math.PI;
    const altH = Math.atan2(hgt, dist) * 180 / Math.PI;
    return { aMin: Math.min(ang1, ang2), aMax: Math.max(ang1, ang2), altH };
}

function updateAll() {
    const sideCanv = document.getElementById('sideViz');
    if (!sideCanv) return;
    
    if (!sideCtx) sideCtx = sideCanv.getContext('2d');
    if (!frontCtx) frontCtx = document.getElementById('frontViz').getContext('2d');

    const mIdx = parseInt(document.getElementById('month').value);
    const hour = parseFloat(document.getElementById('hour').value);
    document.getElementById('monthLabel').innerText = months[mIdx];
    document.getElementById('timeLabel').innerText = formatTime(hour);

    const L = parseFloat(document.getElementById('len').value) || 1;
    const facingAz = parseFloat(document.getElementById('dir').value);
    const tilt = parseFloat(document.getElementById('tilt').value);
    const panelBeta = 90 - tilt;
    const dist = parseFloat(document.getElementById('dist').value) || 1;
    const hgt = parseFloat(document.getElementById('hgt').value) || 0;
    const obsW = parseFloat(document.getElementById('obsW').value) || 0;
    const obsPos = document.getElementById('obsPos').value;

    const area = L * 1.5;
    const obsAngles = getObstructionAngles(L, obsW, dist, hgt, obsPos);

    const sun = getSunPos(daysInYear[mIdx], hour);

    let annualYield = 0;
    for (let i = 0; i < 12; i++) {
        let monthDailyYield = 0;
        for (let h = 6; h <= 18; h += 0.5) {
            const hSun = getSunPos(daysInYear[i], h);
            if (hSun.alt <= 0) continue;
            const relativeSunAz = hSun.az - facingAz;
            const hShaded = (relativeSunAz >= obsAngles.aMin && relativeSunAz <= obsAngles.aMax && hSun.alt < obsAngles.altH);
            const shadeFactor = hShaded ? 0.2 : 1.0;
            const altR = hSun.alt * Math.PI / 180;
            const MaritimeBetaR = panelBeta * Math.PI / 180;
            const azDiffR = (hSun.az - facingAz) * Math.PI / 180;
            const cosInc = Math.max(0, Math.sin(altR) * Math.cos(MaritimeBetaR) + Math.cos(altR) * Math.sin(MaritimeBetaR) * Math.cos(azDiffR));
            if (cosInc > 0) {
                const ghi = 1000 * Math.pow(Math.sin(altR), 0.5);
                monthDailyYield += ghi * cosInc * shadeFactor * area * 0.242 * 0.8 * 0.5 / 1000;
            }
        }
        annualYield += monthDailyYield * 30.4;
    }

    const cost = parseFloat(document.getElementById('cost').value) || 1;
    const annualSavings = annualYield * 0.13;
    const roi = cost / (annualSavings || 0.001);

    document.getElementById('yieldVal').innerText = Math.round(annualYield);
    document.getElementById('savingsVal').innerText = Math.round(annualSavings);
    document.getElementById('roiVal').innerText = roi.toFixed(1);

    drawSideViz(sun, tilt, dist, hgt, obsAngles, facingAz);
    drawFrontViz(mIdx, sun, L, dist, hgt, obsAngles, facingAz);
}

function drawSideViz(sun, tilt, dist, hgt, obsAngles, facingAz) {
    const ctx = sideCtx;
    const cw = ctx.canvas.width; const ch = ctx.canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    const balcY = 150;
    const groundY = ch - 20;
    const altToY = (alt) => balcY - (alt / 90) * (balcY - 30);
    const bX = 40; const balcW = 20;
    const scale = Math.min(10, (cw - bX - 50) / (dist + 2));

    ctx.fillStyle = '#1B263B'; ctx.fillRect(0, 0, bX, ch);
    ctx.fillStyle = '#334155'; ctx.fillRect(0, groundY, cw, ch);
    ctx.fillStyle = '#475569'; ctx.fillRect(bX, balcY, balcW, 5);

    ctx.save();
    ctx.translate(bX + balcW + 2, balcY + 5);
    ctx.rotate(-tilt * Math.PI / 180);
    ctx.fillStyle = '#0077B6'; ctx.fillRect(0, -30, 4, 30);
    ctx.restore();

    if (hgt > 0) {
        const oX = bX + balcW + dist * scale;
        const oY_top = altToY(obsAngles.altH);
        ctx.fillStyle = '#1B263B';
        ctx.fillRect(oX, oY_top, cw - oX, groundY - oY_top);
    }

    if (sun.alt > 0) {
        const relAz = (sun.az - facingAz) * Math.PI / 180;
        const projectedDist = 120 * Math.cos(relAz);
        if (projectedDist > 0) {
            const sX = bX + balcW + projectedDist;
            const sY = altToY(sun.alt);
            ctx.beginPath(); ctx.arc(sX, sY, 10, 0, 2 * Math.PI);
            ctx.fillStyle = '#FF8C00'; ctx.fill();
            const shaded = (relAz * 180 / Math.PI >= obsAngles.aMin && relAz * 180 / Math.PI <= obsAngles.aMax && sun.alt < obsAngles.altH);
            ctx.strokeStyle = shaded ? '#FF0000' : 'rgba(0, 119, 182, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(sX, sY); ctx.lineTo(bX + balcW + 4, balcY - 10); ctx.stroke();
        }
    }
}

function drawFrontViz(mIdx, currentSun, L, dist, hgt, obsAngles, facingAz) {
    const ctx = frontCtx;
    const cw = ctx.canvas.width; const ch = ctx.canvas.height;
    ctx.clearRect(0, 0, cw, ch);
    const horizonY = 160;
    const altToY = (alt) => horizonY - (alt / 90) * (horizonY - 30);
    const azToX = (localAz) => (localAz + 90) / 180 * cw;

    ctx.fillStyle = '#f8f9fa'; ctx.fillRect(0, horizonY, cw, ch - horizonY);

    if (hgt > 0 && obsAngles.aMax > obsAngles.aMin) {
        const x1 = Math.max(0, azToX(obsAngles.aMin));
        const x2 = Math.min(cw, azToX(obsAngles.aMax));
        const yTop = altToY(obsAngles.altH);
        ctx.fillStyle = '#1B263B';
        ctx.fillRect(x1, yTop, x2 - x1, horizonY - yTop);
    }

    ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    for (let h = 5; h <= 19; h += 0.5) {
        const hSun = getSunPos(daysInYear[mIdx], h);
        const localAz = hSun.az - facingAz;
        if (hSun.alt >= 0 && localAz >= -90 && localAz <= 90) {
            const shaded = (localAz >= obsAngles.aMin && localAz <= obsAngles.aMax && hSun.alt < obsAngles.altH);
            ctx.fillStyle = shaded ? '#FF0000' : '#0000FF';
            ctx.beginPath(); ctx.arc(azToX(localAz), altToY(hSun.alt), 2, 0, 2*Math.PI); ctx.fill();
        }
    }
    ctx.setLineDash([]);

    if (currentSun.alt >= 0) {
        const localAz = currentSun.az - facingAz;
        if (localAz >= -90 && localAz <= 90) {
            const shaded = (localAz >= obsAngles.aMin && localAz <= obsAngles.aMax && currentSun.alt < obsAngles.altH);
            ctx.beginPath(); ctx.arc(azToX(localAz), altToY(currentSun.alt), 8, 0, 2*Math.PI);
            ctx.fillStyle = '#FF8C00'; ctx.fill();
        }
    }
}

// --- Contact Form ---
function submitForm() {
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const message = document.getElementById('contact-message').value;
    const feedback = document.getElementById('form-feedback');

    if (!name || !email || !message) {
        feedback.innerText = "Please fill in all required fields.";
        feedback.className = "feedback error";
        return;
    }

    if (!validateEmail(email)) {
        feedback.innerText = "Please enter a valid email address.";
        feedback.className = "feedback error";
        return;
    }

    feedback.innerText = "Sending...";
    feedback.className = "feedback";

    setTimeout(() => {
        feedback.innerText = "Thank you! We'll be in touch shortly.";
        feedback.className = "feedback success";
        document.getElementById('contact-name').value = '';
        document.getElementById('contact-email').value = '';
        document.getElementById('contact-message').value = '';
    }, 1500);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// --- Initialization ---
window.onload = () => {
    initSlideshow();
};
