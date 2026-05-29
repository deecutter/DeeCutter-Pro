// نصوص الواجهتين (عربي فخم وإنجليزي فخم)
const translations = {
    en: {
        heading: "Your Smart Tool to Trim & Download Video",
        subHeading: "Paste the link, select your favorite segment, and download in high quality",
        button: "Analyze Link",
        placeholder: "Paste YouTube video link here...",
        dir: "ltr",
        font: "'Poppins', sans-serif",
        startLabel: "Start Time",
        endLabel: "End Time",
        qualityPlaceholder: "Quality: 720p",
        formatPlaceholder: "Format: MP4",
        btnFull: "Download Full Video",
        btnTrim: "Trim & Download",
        alertEmpty: "Please paste a link first!",
        alertInvalid: "Invalid URL! Only YouTube links are allowed.",
        testTitle: "Sample YouTube Video Title (Mock Data)"
    },
    ar: {
        heading: "أداتك الذكية لقص وتحميل الفيديو",
        subHeading: "ضع الرابط، حدد وقتك المفضّل، وحمّل بجودة عالية",
        button: "تحليل الرابط",
        placeholder: "...هنا YouTube الصق رابط فيديو",
        dir: "rtl",
        font: "'Tajawal', sans-serif",
        startLabel: "وقت البدء",
        endLabel: "وقت النهاية",
        qualityPlaceholder: "الجودة: 720p",
        formatPlaceholder: "الصيغة: MP4",
        btnFull: "تحميل كامل للفيديو",
        btnTrim: "قص وتحميل الجزء المحدد",
        alertEmpty: "الرجاء لصق الرابط أولاً!",
        alertInvalid: "رابط غير صحيح! الأداة تدعم روابط اليوتيوب فقط.",
        testTitle: "عنوان فيديو اليوتيوب التجريبي (بيانات محاكاة)"
    }
};

function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) { el.innerText = text; }
}

function safeSetPlaceholder(id, text) {
    const el = document.getElementById(id);
    if (el) { el.placeholder = text; }
}

function applyLanguage(lang) {
    const data = translations[lang];

    safeSetText('mainHeading', data.heading);
    safeSetText('subHeading', data.subHeading);
    safeSetText('fetchBtn', data.button);
    safeSetPlaceholder('videoLink', data.placeholder);
    safeSetText('startTimeLabel', data.startLabel);
    safeSetText('endTimeLabel', data.endLabel);
    safeSetText('qualityPlaceholder', data.qualityPlaceholder);
    safeSetText('formatPlaceholder', data.formatPlaceholder);
    safeSetText('fullDownloadBtn', data.btnFull);
    safeSetText('trimDownloadBtn', data.btnTrim);

    const previewCard = document.getElementById('previewCard');
    const videoTitle = document.getElementById('videoTitle');
    if (previewCard && previewCard.style.display !== 'none' && videoTitle) {
        videoTitle.innerText = data.testTitle;
    }

    const mainCard = document.querySelector('.main-card');
    if (mainCard) { mainCard.style.direction = data.dir; }
    document.body.style.fontFamily = data.font;
}

function setLanguage(lang) {
    localStorage.setItem('selectedLanguage', lang);
    applyLanguage(lang);
    const dropdown = document.getElementById('langDropdown');
    if (dropdown) { dropdown.classList.remove('show'); }
}

function extractYouTubeVideoId(url) {
    const match = url.match(/(?:youtube\.com\/(?:.*v=|.*\/embed\/|.*\/shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
    return match ? match[1] : null;
}

function hideElement(el) { if (el) { el.style.display = 'none'; } }
// تم تعديل دالة showElement لتدعم الـ flex والـ block بشكل صحيح
function showElement(el, type = 'block') { if (el) { el.style.display = type; } }

// 🌟 تعديل الوقت ليكون ديناميكياً لتلافي مشكلة ثبات الـ 3 دقائق ونص
let timelineTotalSeconds = 210;

function formatTimeFromPercent(percent) {
    const clamped = Math.min(Math.max(Number(percent), 0), 100);
    const seconds = Math.round((clamped / 100) * timelineTotalSeconds);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function parseTimeText(value) {
    const normalized = String(value).trim();
    const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    if (Number.isNaN(minutes) || Number.isNaN(seconds) || seconds > 59) return null;

    return minutes * 60 + seconds;
}

function getPercentFromSeconds(seconds) {
    const clamped = Math.min(Math.max(Number(seconds), 0), timelineTotalSeconds);
    return Math.round((clamped / timelineTotalSeconds) * 100);
}

function updateTimelineProgress() {
    const rangeStart = document.getElementById('rangeStart');
    const rangeEnd = document.getElementById('rangeEnd');
    const progress = document.getElementById('timelineProgress');
    const mainCard = document.querySelector('.main-card');
    
    const minVal = parseInt(rangeStart.value);
    const maxVal = parseInt(rangeEnd.value);
    const maxLimit = parseInt(rangeStart.max) || 100;
    
    const startPercent = (minVal / maxLimit) * 100;
    const endPercent = (maxVal / maxLimit) * 100;
    
    const isLTR = mainCard && mainCard.style.direction === 'ltr';
    
    if (isLTR) {
        progress.style.right = 'auto';
        progress.style.left = startPercent + '%';
        progress.style.width = (endPercent - startPercent) + '%';
    } else {
        progress.style.left = 'auto';
        progress.style.right = startPercent + '%';
        progress.style.width = (endPercent - startPercent) + '%';
    }
}

function fetchVideoTitle(videoLink, data) {
    const titleElement = document.getElementById('videoTitle');
    if (!titleElement) return;

    fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoLink)}&format=json`)
        .then((response) => {
            if (!response.ok) throw new Error('oEmbed request failed');
            return response.json();
        })
        .then((videoData) => {
            if (videoData && videoData.title) {
                titleElement.innerText = videoData.title;
            }
        })
        .catch((error) => {
            console.warn('Unable to fetch video title:', error);
            const activeText = titleElement.innerText;
            if (activeText.includes('جاري جلب عنوان الفيديو الحقيقي') || activeText.includes('Fetching real video title')) {
                titleElement.innerText = data.testTitle;
            }
        });
}

function handleRangeStartChange() {
    const rangeStart = document.getElementById('rangeStart');
    const rangeEnd = document.getElementById('rangeEnd');
    const startTimeInput = document.getElementById('startTimeInput');
    if (!rangeStart || !rangeEnd || !startTimeInput) return;

    let startValue = Number(rangeStart.value);
    const endValue = Number(rangeEnd.value);
    if (startValue > endValue) {
        startValue = endValue;
        rangeStart.value = String(startValue);
    }

    startTimeInput.value = formatTimeFromPercent(startValue);
    updateTimelineProgress();

    if (window.player && typeof window.player.seekTo === 'function') {
        const calculatedSeconds = Math.round((startValue / 100) * timelineTotalSeconds);
        window.player.seekTo(calculatedSeconds, true);
        window.player.pauseVideo();
    }
}

function handleRangeEndChange() {
    const rangeStart = document.getElementById('rangeStart');
    const rangeEnd = document.getElementById('rangeEnd');
    const endTimeInput = document.getElementById('endTimeInput');
    if (!rangeStart || !rangeEnd || !endTimeInput) return;

    let endValue = Number(rangeEnd.value);
    const startValue = Number(rangeStart.value);
    if (endValue < startValue) {
        endValue = startValue;
        rangeEnd.value = String(endValue);
    }

    endTimeInput.value = formatTimeFromPercent(endValue);
    updateTimelineProgress();

    if (window.player && typeof window.player.seekTo === 'function') {
        const calculatedSeconds = Math.round((endValue / 100) * timelineTotalSeconds);
        window.player.seekTo(calculatedSeconds, true);
        window.player.pauseVideo();
    }
}

function handleStartTimeInputChange() {
    const rangeStart = document.getElementById('rangeStart');
    const rangeEnd = document.getElementById('rangeEnd');
    const startTimeInput = document.getElementById('startTimeInput');
    if (!rangeStart || !rangeEnd || !startTimeInput) return;

    const seconds = parseTimeText(startTimeInput.value);
    if (seconds === null) return;

    let percent = getPercentFromSeconds(seconds);
    const endValue = Number(rangeEnd.value);
    if (percent > endValue) {
        percent = endValue;
        startTimeInput.value = formatTimeFromPercent(percent);
    }

    rangeStart.value = String(percent);
    updateTimelineProgress();

    if (window.player && typeof window.player.seekTo === 'function') {
        window.player.seekTo(seconds, true);
        window.player.pauseVideo();
    }
}

function handleEndTimeInputChange() {
    const rangeStart = document.getElementById('rangeStart');
    const rangeEnd = document.getElementById('rangeEnd');
    const endTimeInput = document.getElementById('endTimeInput');
    if (!rangeStart || !rangeEnd || !endTimeInput) return;

    const seconds = parseTimeText(endTimeInput.value);
    if (seconds === null) return;

    let percent = getPercentFromSeconds(seconds);
    const startValue = Number(rangeStart.value);
    if (percent < startValue) {
        percent = startValue;
        endTimeInput.value = formatTimeFromPercent(percent);
    }

    rangeEnd.value = String(percent);
    updateTimelineProgress();

    if (window.player && typeof window.player.seekTo === 'function') {
        window.player.seekTo(seconds, true);
        window.player.pauseVideo();
    }
}

function handleTrimButtonClick() {
    const timeFieldsWrapper = document.getElementById('timeFieldsWrapper');
    const buttonsGroup = document.querySelector('.buttons-group');
    const fullDownloadBtn = document.getElementById('fullDownloadBtn');
    const trimDownloadBtn = document.getElementById('trimDownloadBtn');
    if (!timeFieldsWrapper) return;

    if (buttonsGroup) buttonsGroup.style.display = 'none';
    if (fullDownloadBtn) fullDownloadBtn.style.display = 'none';
    if (trimDownloadBtn) trimDownloadBtn.style.display = 'none';

    showElement(timeFieldsWrapper);
    requestAnimationFrame(() => {
        timeFieldsWrapper.style.opacity = '1';
    });
}

function analyzeVideoLink() {
    const lang = localStorage.getItem('selectedLanguage') || 'en';
    const data = translations[lang];
    const videoLinkInput = document.getElementById('videoLink');
    const previewCard = document.getElementById('previewCard');
    const timeFieldsWrapper = document.getElementById('timeFieldsWrapper');
    const videoLink = videoLinkInput ? videoLinkInput.value.trim() : '';
    const qualitySelect = document.getElementById('videoQuality');

    if (!videoLink) {
        alert(data.alertEmpty);
        hideElement(previewCard);
        return;
    }

    const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(videoLink);
    if (!isYouTube) {
        alert(data.alertInvalid);
        hideElement(previewCard);
        return;
    }

    const videoId = extractYouTubeVideoId(videoLink);
    if (!videoId) {
        alert(data.alertInvalid);
        hideElement(previewCard);
        return;
    }

    const videoThumb = document.getElementById('videoThumb');
    const videoTitle = document.getElementById('videoTitle');
    const rangeStart = document.getElementById('rangeStart');
    const rangeEnd = document.getElementById('rangeEnd');
    const startTimeInput = document.getElementById('startTimeInput');
    const endTimeInput = document.getElementById('endTimeInput');

    if (videoThumb) {
        videoThumb.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    if (videoTitle) {
        videoTitle.innerText = lang === 'ar' ? 'جاري جلب عنوان الفيديو الحقيقي...' : 'Fetching real video title...';
    }

    showElement(previewCard);
    if (timeFieldsWrapper) {
        hideElement(timeFieldsWrapper);
        timeFieldsWrapper.style.opacity = '0';
    }

    const buttonsGroup = document.querySelector('.buttons-group');
    const fullDownloadBtn = document.getElementById('fullDownloadBtn');
    const trimDownloadBtn = document.getElementById('trimDownloadBtn');
    if (buttonsGroup) buttonsGroup.style.display = 'flex';
    if (fullDownloadBtn) fullDownloadBtn.style.display = '';
    if (trimDownloadBtn) trimDownloadBtn.style.display = '';

    if (rangeStart) rangeStart.value = '0';
    if (rangeEnd) rangeEnd.value = '100';
    if (startTimeInput) startTimeInput.value = '00:00';
    if (endTimeInput) endTimeInput.value = '03:30';

    if (qualitySelect) {
        setQualitySelectLoading(true, lang === 'ar' ? 'جاري جلب الجودات...' : 'Loading qualities...');
    }

    updateTimelineProgress();
    fetchVideoTitle(videoLink, data);

    fetch('https://deecutter-pro.onrender.com/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoLink })
    })
    .then(async (response) => {
        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || 'Unable to analyze video');
        }
        return response.json();
    })
    .then((payload) => {
        if (!payload.success) {
            throw new Error(payload.message || 'Unable to analyze video');
        }

        if (payload.duration && typeof payload.duration === 'number') {
            timelineTotalSeconds = Math.max(1, Math.round(payload.duration));
            if (endTimeInput) endTimeInput.value = formatTimeFromPercent(100);
        }

        if (videoTitle && payload.title) {
            videoTitle.innerText = payload.title;
        }

        // Immediately clear existing options and populate from backend 'qualities' array
        const qualities = Array.isArray(payload.qualities) ? payload.qualities : [];
        if (qualitySelect) {
            qualitySelect.innerHTML = '';

            if (qualities.length === 0) {
                setQualitySelectLoading(false, lang === 'ar' ? 'لا توجد جودات متاحة' : 'No available qualities');
            } else {
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                defaultOption.textContent = lang === 'ar' ? 'اختر الجودة' : 'Select quality';
                qualitySelect.appendChild(defaultOption);

                qualities.forEach((q) => {
                    const option = document.createElement('option');
                    option.value = q;
                    option.textContent = q;
                    qualitySelect.appendChild(option);
                });

                qualitySelect.disabled = false;
            }
        }
    })
    .catch((error) => {
        console.error('Analyze Error:', error);
        displayStatusMessage(lang === 'ar' ? 'تعذر تحليل الرابط. تأكد من صحة الرابط وحاول مرة أخرى.' : 'Could not analyze link. Please check the URL and try again.');
        hideElement(previewCard);
        if (qualitySelect) {
            setQualitySelectLoading(false, lang === 'ar' ? 'لا توجد جودات متاحة' : 'No available qualities');
        }
    })
    .finally(() => {
        if (qualitySelect && !qualitySelect.disabled && qualitySelect.children.length === 1) {
            qualitySelect.disabled = false;
        }
    });

    if (window.YT && window.YT.Player) {
        initializeYouTubePlayer(videoId);
    } else {
        const checkAPI = setInterval(() => {
            if (window.YT && window.YT.Player) {
                clearInterval(checkAPI);
                initializeYouTubePlayer(videoId);
            }
        }, 100);
        setTimeout(() => clearInterval(checkAPI), 5000);
    }
}

function setQualitySelectLoading(isLoading, placeholderText) {
    const qualitySelect = document.getElementById('videoQuality');
    if (!qualitySelect) return;

    qualitySelect.disabled = isLoading;
    qualitySelect.innerHTML = '';

    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    placeholderOption.textContent = placeholderText;
    qualitySelect.appendChild(placeholderOption);
}

function populateQualityOptions(resolutions, placeholderText = 'Select quality') {
    const qualitySelect = document.getElementById('videoQuality');
    if (!qualitySelect) return;

    qualitySelect.innerHTML = '';

    if (!Array.isArray(resolutions) || resolutions.length === 0) {
        setQualitySelectLoading(false, placeholderText);
        return;
    }

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = placeholderText;
    qualitySelect.appendChild(defaultOption);

    resolutions.forEach((resolution) => {
        const option = document.createElement('option');
        option.value = resolution;
        option.textContent = resolution;
        qualitySelect.appendChild(option);
    });
    qualitySelect.disabled = false;
}

// 🌟 الدالة الكبرى المعدلة والمصلحة بالكامل لربط العداد وحل مشكلة الـ MP3
function handleExecuteTrimButtonClick() {
    const videoLinkInput = document.getElementById('videoLink');
    const videoQuality = document.getElementById('videoQuality');
    const videoFormat = document.getElementById('videoFormat');
    const startTimeInput = document.getElementById('startTimeInput');
    const endTimeInput = document.getElementById('endTimeInput');
    const executeTrimBtn = document.getElementById('executeTrimBtn');
    
    const progressContainer = document.getElementById('downloadProgressContainer');
    const progressBar = document.getElementById('downloadProgressBar');
    const progressText = document.getElementById('downloadProgressText');

    const url = videoLinkInput ? videoLinkInput.value.trim() : '';
    const quality = videoQuality ? videoQuality.value : '';
    const format = videoFormat ? videoFormat.value : 'mp4';
    const startTimeStr = startTimeInput ? startTimeInput.value : '00:00';
    const endTimeStr = endTimeInput ? endTimeInput.value : '03:30';

    const startSeconds = parseTimeText(startTimeStr) || 0;
    const endSeconds = parseTimeText(endTimeStr) || 0;

    if (!url) {
        const lang = localStorage.getItem('selectedLanguage') || 'en';
        alert(translations[lang].alertEmpty);
        return;
    }

    // توليد معرف فريد للمستخدم لربط بث العداد المباشر مع السيرفر
    const clientId = 'client_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = '0%';

    if (executeTrimBtn) {
        executeTrimBtn.innerText = format === 'mp3' ? 'جاري استخلاص الصوت...' : 'جاري معالجة وقص الفيديو...';
        executeTrimBtn.disabled = true;
    }

    // فتح خط الاتصال الحي والمستمر (SSE) مع السيرفر لالتقاط العداد
    const progressSource = new EventSource(`https://deecutter-pro.onrender.com/api/progress/${clientId}`);
    
    progressSource.onmessage = function(event) {
        const percent = event.data;
        if (progressBar) progressBar.style.width = percent + '%';
        if (progressText) progressText.textContent = percent + '%';
        
        if (percent === '100') {
            progressSource.close();
        }
    };

    progressSource.onerror = function() {
        console.warn("قناة العداد أغلقت.");
        progressSource.close();
    };

    const trimParams = {
        url: url,
        quality: quality,
        format: format,
        start: startSeconds,
        end: endSeconds,
        clientId: clientId
    };

    console.log('Sending trim request with tracking ID:', trimParams);
    
    fetch('https://deecutter-pro.onrender.com/api/trim-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trimParams)
    })
    .then(response => {
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        return response.blob();
    })
    .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        
        // 🌟 حل مشكلة الـ MP3: تحديد امتداد الملف ديناميكياً حسب اختيار المستخدم
        const fileExtension = format === 'mp3' ? 'mp3' : 'mp4';
        downloadLink.download = `DeeCutter_${Date.now()}.${fileExtension}`;
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setTimeout(() => {
            try { window.URL.revokeObjectURL(blobUrl); } catch (e) { console.warn('Revoke failed', e); }
        }, 1000);
        
        displayStatusMessage(format === 'mp3' ? 'تم تحميل الصوت بنجاح! 🎵' : 'تم تحميل مقطعك المقصوص بنجاح! 📺');
    })
    .catch(error => {
        console.error('Trim Error:', error);
        displayStatusMessage('حدث خطأ أثناء المعالجة: ' + error.message);
        progressSource.close();
    })
    .finally(() => {
        if (executeTrimBtn) {
            executeTrimBtn.innerText = format === 'mp3' ? 'تحميل الصوت المحدد' : 'تحميل الجزء المحدد فقط';
            executeTrimBtn.disabled = false;
        }
        setTimeout(() => {
            if (progressContainer) progressContainer.style.display = 'none';
        }, 3000);
    });
}

function displayStatusMessage(message) {
    let statusDisplay = document.getElementById('statusDisplay');
    if (!statusDisplay) {
        statusDisplay = document.createElement('div');
        statusDisplay.id = 'statusDisplay';
        statusDisplay.style.cssText = 'margin-top: 15px; padding: 10px; border-radius: 5px; text-align: center; font-weight: 500;';
        
        const buttonsGroup = document.querySelector('.buttons-group');
        if (buttonsGroup && buttonsGroup.parentNode) {
            buttonsGroup.parentNode.insertBefore(statusDisplay, buttonsGroup.nextSibling);
        } else {
            document.body.appendChild(statusDisplay);
        }
    }
    
    const isError = message.toLowerCase().includes('error') || message.includes('خطأ');
    statusDisplay.textContent = message;
    statusDisplay.style.backgroundColor = isError ? '#ffebee' : '#e8f5e9';
    statusDisplay.style.color = isError ? '#c62828' : '#2e7d32';
    statusDisplay.style.display = 'block';
    
    setTimeout(() => {
        statusDisplay.style.display = 'none';
    }, 5000);
}

function initTimelineControls() {
    const rangeStart = document.getElementById('rangeStart');
    const rangeEnd = document.getElementById('rangeEnd');
    const startTimeInput = document.getElementById('startTimeInput');
    const endTimeInput = document.getElementById('endTimeInput');

    if (rangeStart) rangeStart.addEventListener('input', handleRangeStartChange);
    if (rangeEnd) rangeEnd.addEventListener('input', handleRangeEndChange);
    if (startTimeInput) startTimeInput.addEventListener('input', handleStartTimeInputChange);
    if (endTimeInput) endTimeInput.addEventListener('input', handleEndTimeInputChange);

    updateTimelineProgress();
}

function loadYouTubeAPI() {
    if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
}

let player = null;
let playerMonitorInterval = null;

window.onYouTubeIframeAPIReady = function() {
    console.log('YouTube IFrame API is ready');
};

function initializeYouTubePlayer(videoId) {
    if (playerMonitorInterval) {
        clearInterval(playerMonitorInterval);
        playerMonitorInterval = null;
    }

    const playerContainer = document.getElementById('youtubePlayerContainer');
    if (!playerContainer) return;
    if (!window.YT || !window.YT.Player) return;

    if (player && typeof player.destroy === 'function') {
        player.destroy();
    }

    playerContainer.style.display = 'block';
    const videoThumb = document.getElementById('videoThumb');
    if (videoThumb) { videoThumb.style.display = 'none'; }

    player = new window.YT.Player('youtubePlayerContainer', {
        height: '360',
        width: '100%',
        videoId: videoId,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        },
        playerVars: {
            'autoplay': 0,
            'controls': 1,
            'modestbranding': 1,
            'rel': 0,
            'fs': 1
        }
    });

    window.player = player;
}

// 🌟 تحديث دالة جاهزية المشغل لتجلب الوقت الحقيقي للفيديو ديناميكياً وتحديث الواجهة
function onPlayerReady(event) {
    console.log('YouTube player ready');
    if (player && typeof player.getDuration === 'function') {
        const duration = player.getDuration();
        if (duration && duration > 0) {
            timelineTotalSeconds = Math.round(duration);
            console.log("Real video duration loaded dynamic: " + timelineTotalSeconds + " seconds");
            
            const endTimeInput = document.getElementById('endTimeInput');
            if (endTimeInput) {
                endTimeInput.value = formatTimeFromPercent(100);
            }
        }
    }
    startVideoPlaybackMonitor();
}

function onPlayerStateChange(event) {
    const playerState = event.data;
    if (playerState === window.YT.PlayerState.PLAYING) {
        console.log('Video is playing');
    }
}

function startVideoPlaybackMonitor() {
    if (playerMonitorInterval) clearInterval(playerMonitorInterval);

    playerMonitorInterval = setInterval(function() {
        if (!player || typeof player.getPlayerState !== 'function') return;

        const playerState = player.getPlayerState();
        if (playerState !== window.YT.PlayerState.PLAYING) return;

        const rangeEnd = document.getElementById('rangeEnd');
        if (!rangeEnd) return;

        const endPercent = Number(rangeEnd.value);
        const endSeconds = Math.round((endPercent / 100) * timelineTotalSeconds);
        const currentTime = player.getCurrentTime();

        if (currentTime >= endSeconds) {
            const rangeStart = document.getElementById('rangeStart');
            if (!rangeStart) return;

            const startPercent = Number(rangeStart.value);
            const startSeconds = Math.round((startPercent / 100) * timelineTotalSeconds);

            console.log(`Looping from ${currentTime}s back to ${startSeconds}s`);
            player.seekTo(startSeconds, true);
        }
    }, 100);
}

function handleFullDownloadButtonClick(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    const lang = localStorage.getItem('selectedLanguage') || 'en';
    const data = translations[lang];
    
    const videoLinkInput = document.getElementById('videoLink');
    const videoQualitySelect = document.getElementById('videoQuality');
    const videoFormatSelect = document.getElementById('videoFormat');
    const fullDownloadBtn = document.getElementById('fullDownloadBtn');
    
    const youtubeUrl = videoLinkInput ? videoLinkInput.value.trim() : '';
    const quality = videoQualitySelect ? videoQualitySelect.value : '';
    const format = videoFormatSelect ? videoFormatSelect.value : '';
    
    if (!youtubeUrl) {
        alert(data.alertEmpty);
        return;
    }
    
    const originalButtonText = fullDownloadBtn ? fullDownloadBtn.innerText : 'Download Full Video';
    
    // توليد معرف فريد للمستخدم لربط بث العداد المباشر مع السيرفر
    const clientId = 'client_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const progressContainer = document.getElementById('downloadProgressContainer');
    const progressBar = document.getElementById('downloadProgressBar');
    const progressText = document.getElementById('downloadProgressText');

    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = '0%';
    
    if (fullDownloadBtn) {
        fullDownloadBtn.innerText = 'جاري التحميل...';
        fullDownloadBtn.disabled = true;
    }
    
    // فتح خط الاتصال الحي والمستمر (SSE) مع السيرفر لالتقاط العداد
    const progressSource = new EventSource(`https://deecutter-pro.onrender.com/api/progress/${clientId}`);
    
    progressSource.onmessage = function(event) {
        const percent = event.data;
        if (progressBar) progressBar.style.width = percent + '%';
        if (progressText) progressText.textContent = percent + '%';
        
        if (percent === '100') {
            progressSource.close();
        }
    };

    progressSource.onerror = function() {
        console.warn("قناة العداد أغلقت.");
        progressSource.close();
    };
    
    const downloadParams = {
        url: youtubeUrl,
        quality: quality,
        format: format,
        clientId: clientId
    };
    
    fetch('https://deecutter-pro.onrender.com/api/download-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(downloadParams)
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.blob();
    })
    .then(blob => {
        // Create download link for the blob
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        const fileExtension = format === 'mp3' ? 'mp3' : 'mp4';
        downloadLink.download = `DeeCutter_Full_${Date.now()}.${fileExtension}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setTimeout(() => {
            try { URL.revokeObjectURL(downloadLink.href); } catch (e) { console.warn('Revoke failed', e); }
        }, 1000);
        
        // Display success message
        const successMsg = lang === 'ar' ? 'تم تحميل الملف بنجاح! ✅' : 'File downloaded successfully! ✅';
        displayStatusMessage(successMsg);
        
        progressSource.close();
    })
    .catch(error => {
        console.error('Full Download Error:', error);
        const errorMsg = lang === 'ar' ? 'خطأ: ' + error.message : 'Error: ' + error.message;
        displayStatusMessage(errorMsg);
        progressSource.close();
    })
    .finally(() => {
        if (fullDownloadBtn) {
            fullDownloadBtn.innerText = originalButtonText;
            fullDownloadBtn.disabled = false;
        }
        setTimeout(() => {
            if (progressContainer) progressContainer.style.display = 'none';
        }, 3000);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadYouTubeAPI();

    const savedLang = localStorage.getItem('selectedLanguage') || 'en';
    applyLanguage(savedLang);

    const fetchBtn = document.getElementById('fetchBtn');
    if (fetchBtn) fetchBtn.addEventListener('click', analyzeVideoLink);

    const trimDownloadBtn = document.getElementById('trimDownloadBtn');
    if (trimDownloadBtn) trimDownloadBtn.addEventListener('click', handleTrimButtonClick);

    const executeTrimBtn = document.getElementById('executeTrimBtn');
    if (executeTrimBtn) executeTrimBtn.addEventListener('click', handleExecuteTrimButtonClick);

const fullDownloadBtn = document.getElementById('fullDownloadBtn');
if (fullDownloadBtn) {
    fullDownloadBtn.type = 'button';
    fullDownloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleFullDownloadButtonClick(e);
    });
}

    // Prevent any form on the page from submitting and reloading the page
    document.querySelectorAll('form').forEach((f) => {
        f.addEventListener('submit', (e) => e.preventDefault());
    });

    initTimelineControls();

    const menuBtn = document.getElementById('menuBtn');
    const langDropdown = document.getElementById('langDropdown');
    if (menuBtn && langDropdown) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            langDropdown.classList.remove('show');
        });
    }
});
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(() => console.log('DeeCutter App Mode Ready!'))
        .catch(err => console.log('App Mode Error', err));
}
