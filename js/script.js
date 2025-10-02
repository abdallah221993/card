// script.js (مُحدّث لاستخدام remove.bg API مع fallback محلي + تحميل البطاقة بجودة عالية)

// --------- إعدادات (ضع هنا مفتاحك الخاص) ----------
const REMOVE_BG_API_KEY = 'VXz55xAL48D2xp4LL3EQhTYh'; // **احفظه سرياً**
// ----------------------------------------------------

let processedImageDataUrl = null;
let currentEmployeeData = {};

// عناصر DOM
const employeeForm = document.getElementById('employeeForm');
const employeeNameInput = document.getElementById('employeeName');
const jobTitleInput = document.getElementById('jobTitle');
const phoneNumberInput = document.getElementById('phoneNumber');
const employeeImageInput = document.getElementById('employeeImage');
const generateCardBtn = document.getElementById('generateCard');
const clearFormBtn = document.getElementById('clearForm');
const downloadCardBtn = document.getElementById('downloadCard');
const shareCardBtn = document.getElementById('shareCard');
const loadingOverlay = document.getElementById('loadingOverlay');

// عناصر البطاقة
const cardEmployeeName = document.getElementById('cardEmployeeName');
const cardJobTitle = document.getElementById('cardJobTitle');
const cardPhoneNumber = document.getElementById('cardPhoneNumber');
const processedImage = document.getElementById('processedImage');
const photoPlaceholder = document.querySelector('.photo-placeholder');

// مستمعي الأحداث
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updatePreviewInRealTime();
});

function initializeEventListeners() {
    employeeForm.addEventListener('submit', handleFormSubmit);
    clearFormBtn.addEventListener('click', handleClearForm);

    employeeNameInput.addEventListener('input', updatePreviewText);
    jobTitleInput.addEventListener('input', updatePreviewText);
    phoneNumberInput.addEventListener('input', updatePreviewText);

    employeeImageInput.addEventListener('change', handleImageUpload);

    downloadCardBtn.addEventListener('click', downloadCard);
    shareCardBtn.addEventListener('click', shareOnWhatsApp);
}

function updatePreviewText() {
    cardEmployeeName.textContent = employeeNameInput.value.trim() || 'اسم الموظف';
    cardJobTitle.textContent = jobTitleInput.value.trim() || 'المسمى الوظيفي';
    cardPhoneNumber.textContent = phoneNumberInput.value.trim() || 'رقم الهاتف';
}

function updatePreviewInRealTime() {
    updatePreviewText();
}

// معالجة رفع الصورة
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showNotification('يرجى اختيار ملف صورة صحيح', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showNotification('حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 5 ميجابايت', 'error');
        return;
    }

    try {
        showLoading(true, 'جارِ معالجة الصورة...');
        const originalImageDataUrl = await readFileAsDataURL(file);
        const processedViaApi = await removeBackgroundWithAPI(originalImageDataUrl, file);
        const finalDataUrl = processedViaApi || await processImageLocally(originalImageDataUrl);
        displayProcessedImage(finalDataUrl);
        showNotification('تم معالجة الصورة بنجاح!', 'success');
    } catch (error) {
        console.error(error);
        showNotification('فشل معالجة الصورة.', 'error');
    } finally {
        showLoading(false);
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function removeBackgroundWithAPI(imageDataUrl, originalFile) {
    if (!REMOVE_BG_API_KEY) return null;
    try {
        const formData = new FormData();
        formData.append('image_file', originalFile);
        formData.append('size', 'auto');

        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': REMOVE_BG_API_KEY },
            body: formData
        });

        if (!response.ok) {
            console.error('remove.bg error:', response.status, await response.text());
            return null;
        }

        const blob = await response.blob();
        return await blobToDataURL(blob);
    } catch (err) {
        console.error('API request failed:', err);
        return null;
    }
}

function blobToDataURL(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(blob);
    });
}

async function processImageLocally(imageDataUrl) {
    return imageDataUrl;
}

function displayProcessedImage(dataUrl) {
    processedImageDataUrl = dataUrl;
    processedImage.src = dataUrl;
    processedImage.style.display = 'block';
    photoPlaceholder.style.display = 'none';

    downloadCardBtn.disabled = false;
    shareCardBtn.disabled = false;

    updatePreviewText();
}

// تم إزالة وظائف سحب الصورة للتصميم المبسط

async function handleFormSubmit(event) {
    event.preventDefault();
    if (!validateForm()) return;

    currentEmployeeData = {
        name: employeeNameInput.value.trim(),
        jobTitle: jobTitleInput.value.trim(),
        phone: phoneNumberInput.value.trim(),
        image: processedImageDataUrl
    };

    showNotification('تم إنشاء البطاقة بنجاح!', 'success');
}

function validateForm() {
    if (!employeeNameInput.value.trim()) return false;
    if (!jobTitleInput.value.trim()) return false;
    if (!phoneNumberInput.value.trim()) return false;
    if (!processedImageDataUrl) return false;
    return true;
}

function handleClearForm() {
    employeeForm.reset();
    processedImageDataUrl = null;
    processedImage.style.display = 'none';
    photoPlaceholder.style.display = 'flex';
    updatePreviewText();
    downloadCardBtn.disabled = true;
    shareCardBtn.disabled = true;
}

// --------- تحميل البطاقة مباشرة من العنصر بجودة عالية ---------
async function downloadCard() {
    const cardElement = document.getElementById('cardExportArea');
    if (!cardElement) return;

    // انتظر تحميل الخطوط
    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }

    try {
        const canvas = await html2canvas(cardElement, {
            scale: 3,         // جودة أعلى
            useCORS: true,    // لو في صور خارجية
            logging: false,
            backgroundColor: null // يخلي الخلفية شفافة لو حابب
        });

        const dataUrl = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        const safeName = (employeeNameInput.value.trim() || 'موظف').replace(/\s+/g, '_');
        link.download = `بطاقة_${safeName}.png`;
        link.href = dataUrl;
        link.click();
    } catch (error) {
        console.error('خطأ أثناء توليد الصورة:', error);
    }
}

// --------------------------------------------------------------

async function shareOnWhatsApp() {
    const cardElement = document.getElementById('cardExportArea');

    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }

    const canvas = await html2canvas(cardElement, { scale: 3 });
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

    const file = new File([blob], "employee-card.png", { type: "image/png" });

    if (navigator.share) {
        try {
            await navigator.share({
                files: [file],
                title: "بطاقة موظف",
                text: "شوف بطاقة الموظف"
            });
        } catch (err) {
            console.error("خطأ في المشاركة:", err);
        }
    } else {
        alert("المشاركة بالصور مش مدعومة على هذا المتصفح.");
    }
}


// إشعارات
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        max-width: 380px;
        animation: slideIn 0.25s ease;
    `;
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.25s ease';
        setTimeout(() => {
            if (notification.parentNode) notification.parentNode.removeChild(notification);
        }, 250);
    }, 3500);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-triangle',
        info: 'info-circle',
        warning: 'exclamation-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        info: '#3498db',
        warning: '#f39c12'
    };
    return colors[type] || '#3498db';
}

// تحميل / إخفاء شاشة التحميل
function showLoading(show, message = '') {
    if (!loadingOverlay) return;
    loadingOverlay.style.display = show ? 'flex' : 'none';
    if (show && message) {
        loadingOverlay.querySelector('p').textContent = message;
    }
}
