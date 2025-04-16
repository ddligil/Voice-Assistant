let mediaRecorder;
let audioChunks = [];

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const result = document.getElementById("result");

console.log("script.js yüklendi!");

startBtn.onclick = async () => {
    console.log("🎙️ Kayıt başlatılıyor...");

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                console.log("📦 Ses chunk alındı");
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            if (audioChunks.length === 0) {
                console.warn("⚠️ Hiç ses kaydedilmedi!");
                result.innerText = "Hiç ses algılanmadı. Lütfen tekrar deneyin.";
                return;
            }

            console.log("⏹️ Kayıt durdu, dosya hazırlanıyor...");

            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.wav');

            result.innerText = "Yükleniyor...";

            try {
                const response = await fetch("http://localhost:8000/transcribe", {
                    method: "POST",
                    body: formData,
                });

                console.log("📡 İstek gönderildi, cevap bekleniyor...");

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log("✅ Backend yanıtı:", data);

                result.innerText = `Soru: ${data.text}\nCevap: ${data.answer}`;
            } catch (error) {
                console.error("❌ Fetch hatası:", error);
                result.innerText = "Bir hata oluştu: " + error.message;
            }
        };

        mediaRecorder.start();
        console.log("🎙️ Kayıt başladı...");
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } catch (err) {
        console.error("🚫 Mikrofona erişim hatası:", err);
        result.innerText = "Mikrofona erişilemiyor.";
    }
};

stopBtn.onclick = () => {
    console.log("🛑 Kayıt durduruluyor...");
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
};
