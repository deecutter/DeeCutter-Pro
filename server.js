const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const YtDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 🔥 السطرين السحريين لتشغيل واجهة الموقع وعرض الـ index.html 🔥
app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const isWin = process.platform === 'win32';
const ytDlpPath = isWin ? path.join(__dirname, 'yt-dlp.exe') : path.join(__dirname, 'yt-dlp');
const ytDlpWrap = new YtDlpWrap(ytDlpPath);

// دالة سحرية لتنزيل نسخة اللينكس تلقائياً إذا چان الموقع على سيرفر Render
async function ensureYtDlp() {
    if (!isWin && !fs.existsSync(ytDlpPath)) {
        console.log('⏳ Detecting Linux environment... Downloading yt-dlp binary...');
        try {
            await YtDlpWrap.downloadFromGithub(ytDlpPath);
            fs.chmodSync(ytDlpPath, '755'); // أهم خطوة: إعطاء صلاحية التشغيل لنظام لينكس
            console.log('✅ yt-dlp downloaded successfully and ready for Linux!');
        } catch (err) {
            console.error('❌ Failed to download yt-dlp binary:', err.message);
        }
    }
}
ensureYtDlp();

const progressClients = new Map();

app.listen(PORT, () => {
    console.log(`🚀 ==============================================`);
    console.log(`🚀 DeeCutter-Pro Live Progress Engine is ready!`);
    console.log(`🚀 ==============================================`);
});

// قناة البث المباشر للعداد للمتصفح (SSE)
app.get('/api/progress/:clientId', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const clientId = req.params.clientId;
    progressClients.set(clientId, res);
    req.on('close', () => { progressClients.delete(clientId); });
});

// 🟢 1. مسار جلب وتحليل الجودات الحقيقية - تفرقع ومصلح 100%
app.post('/api/analyze-video', async (req, res) => {
    const { url } = req.body;
    console.log(`\n🔍 [طلب تحليل جديد] جاري جلب الدقات الحقيقية من اليوتيوب...`);
    try {
const stdout = await ytDlpWrap.execPromise([url, '-J', '--no-playlist', '--cookies', path.join(__dirname, 'cookies.txt')]);        const info = JSON.parse(stdout);
        
        const heights = new Set();
        if (info.formats) {
            info.formats.forEach(f => {
                if (f.height && f.vcodec !== 'none' && f.vcodec !== null) {
                    heights.add(f.height);
                }
            });
        }
        
        const availableQualities = Array.from(heights)
            .sort((a, b) => b - a)
            .map(h => `${h}p`);

        console.log(`✅ تم العثور على الجودات التالية للفيديو:`, availableQualities);
        res.json({ success: true, qualities: availableQualities });
    } catch (error) {
        console.error("❌ خطأ في تحليل الرابط وبث الجودات:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 🟢 2. مسار الـ Trim (القص) - شغال لوز اللوز 100% ومحد تقرب صوبه
app.post('/api/trim-video', async (req, res) => {
    const videoStreamUrl = await ytDlpWrap.execPromise([url, '-g', '-f', videoFormat, '--cookies', path.join(__dirname, 'cookies.txt')]);
const audioStreamUrl = await ytDlpWrap.execPromise([url, '-g', '-f', 'bestaudio', '--cookies', path.join(__dirname, 'cookies.txt')]); 
    
    console.log(`\n🎬 [طلب قص جديد] جاري المعالجة بصيغة: ${isMp3 ? 'موسيقى MP3 🎵' : 'فيديو MP4 📺'}`);

    try {
        let videoFormat = 'bestvideo/best'; 
        if (quality) {
            let qNum = quality.replace(/[^0-9]/g, '');
            if (qNum && qNum !== '') videoFormat = `bestvideo[height<=${qNum}]/best`;
        }

        const videoStreamUrl = await ytDlpWrap.execPromise([url, '-g', '-f', videoFormat]);
        const audioStreamUrl = await ytDlpWrap.execPromise([url, '-g', '-f', 'bestaudio']);

        const vUrl = videoStreamUrl.trim().split('\n')[0];
        const aUrl = audioStreamUrl.trim().split('\n')[0];

        const outputFilename = `DeeCutter_${Date.now()}.${isMp3 ? 'mp3' : 'mp4'}`;
        res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
        res.setHeader('Content-Type', isMp3 ? 'audio/mpeg' : 'video/mp4');

        const startTime = parseFloat(start);
        const duration = parseFloat(end) - startTime;

        let ffmpegArgs = [];
        if (isMp3) {
            ffmpegArgs = [
                '-ss', startTime.toString(), '-i', aUrl, '-t', duration.toString(),
                '-vn', '-c:a', 'libmp3lame', '-q:a', '2', '-f', 'mp3', 'pipe:1'
            ];
        } else {
            ffmpegArgs = [
                '-ss', startTime.toString(), '-i', vUrl, '-ss', startTime.toString(), '-i', aUrl, '-t', duration.toString(),
                '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-c:a', 'aac', '-preset', 'superfast',
                '-movflags', 'frag_keyframe+empty_moov', '-f', 'mp4', 'pipe:1'
            ];
        }

        const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);
        ffmpegProcess.stdout.pipe(res);

        ffmpegProcess.stderr.on('data', (data) => {
            const str = data.toString();
            if (str.includes('time=')) {
                const timeLog = str.match(/time=\s*(\d+:\d+:\d+\.\d+)/);
                if (timeLog && duration > 0) {
                    const timeParts = timeLog[1].split(':');
                    const currentSeconds = parseFloat(timeParts[0]) * 3600 + parseFloat(timeParts[1]) * 60 + parseFloat(timeParts[2]);
                    let percent = Math.min(Math.round((currentSeconds / duration) * 100), 99);
                    
                    if (clientId && progressClients.has(clientId)) {
                        progressClients.get(clientId).write(`data: ${percent}\n\n`);
                    }
                }
            }
        });

        ffmpegProcess.on('close', (code) => {
            if (clientId && progressClients.has(clientId)) {
                progressClients.get(clientId).write(`data: 100\n\n`);
            }
            console.log(`✅ كمل القص بنجاح وتفرقع!`);
        });

    } catch (error) {
        console.error("❌ خطأ داخلي في السيرفر بمسار القص:", error.message);
        if (!res.headersSent) res.status(500).json({ success: false });
    }
});

// 🟢 3. مسار التحميل الكامل (Full Download) - مصلح بالصوت والصورة والعداد 100%
app.post('/api/download-full', async (req, res) => {
    const { url, quality, format, clientId } = req.body;
    const isMp3 = format === 'mp3';
    
    console.log(`\n📦 [طلب تحميل كامل] الصيغة المطلوبة: ${isMp3 ? 'صوت MP3 🎵' : 'فيديو كامل مدمج الصوت والصورة 📺'}`);

    const tempFilename = `temp_full_${Date.now()}.${isMp3 ? 'mp3' : 'mp4'}`;
    const tempFilePath = path.join(os.tmpdir(), tempFilename);

    try {
        let dlpArgs = [url, '--no-playlist', '--ffmpeg-location', path.dirname(ffmpegPath)];
        dlpArgs.push('--cookies', path.join(__dirname, 'cookies.txt'));
        
        if (isMp3) {
            dlpArgs.push('-x', '--audio-format', 'mp3', '--audio-quality', '2');
        } else {
            let videoFormat = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
            if (quality) {
                let qNum = quality.replace(/[^0-9]/g, '');
                if (qNum && qNum !== '') {
                    videoFormat = `bestvideo[height<=${qNum}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${qNum}][ext=mp4]/best`;
                }
            }
            dlpArgs.push('-f', videoFormat, '--merge-output-format', 'mp4');
        }
        
        dlpArgs.push('-o', tempFilePath);

        const dlpProcess = spawn(ytDlpPath, dlpArgs);

        dlpProcess.stdout.on('data', (data) => {
            const str = data.toString();
            const match = str.match(/\[download\]\s+(\d+\.\d+)%/);
            if (match) {
                const percent = Math.min(Math.round(parseFloat(match[1])), 99);
                if (clientId && progressClients.has(clientId)) {
                    progressClients.get(clientId).write(`data: ${percent}\n\n`);
                }
            }
        });

        dlpProcess.on('close', (code) => {
            if (code === 0 && fs.existsSync(tempFilePath)) {
                if (clientId && progressClients.has(clientId)) {
                    progressClients.get(clientId).write(`data: 100\n\n`);
                }

                const finalFilename = `DeeCutter_Full_${Date.now()}.${isMp3 ? 'mp3' : 'mp4'}`;
                res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
                res.setHeader('Content-Type', isMp3 ? 'audio/mpeg' : 'video/mp4');

                const fileStream = fs.createReadStream(tempFilePath);
                fileStream.pipe(res);

                fileStream.on('end', () => {
                    fs.unlink(tempFilePath, (err) => {
                        if (err) console.error("خطأ بمسح الملف المؤقت:", err);
                        else console.log(`✅ تم مسح الملف المؤقت وتنظيف السيرفر.`);
                    });
                });
            } else {
                console.error(`❌ فشل تحميل yt-dlp، كود الحالة: ${code}`);
                if (!res.headersSent) res.status(500).json({ error: 'Download failed' });
            }
        });

    } catch (error) {
        console.error("❌ خطأ داخلي في مسار التحميل الكامل:", error.message);
        if (!res.headersSent) res.status(500).json({ error: error.message });
    }
});