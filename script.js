// script.js (نسخة مضبوطة بالكامل)

// --------- إعدادات API ----------
const REMOVE_BG_API_KEY = 'VXz55xAL48D2xp4LL3EQhTYh'; 
// ----------------------------------------------------

let processedImageDataUrl = null;
let currentEmployeeData = {};

// عناصر DOM
const employeeForm = document.getElementById('employeeForm');
const employeeNameInput = document.getElementById('employeeName');
const jobTitleInput = document.getElementById('jobTitle');
const phoneNumberInput = document.getElementById('phoneNumber');
const employeeImageInput = document.getElementById('employeeImage');
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

// عناصر القص (Cropper)
const cropImageBtn = document.getElementById('cropImage');
const cropperModal = document.getElementById('cropperModal');
const cropperImage = document.getElementById('cropperImage');
const confirmCropBtn = document.getElementById('confirmCrop');
const cancelCropBtn = document.getElementById('cancelCrop');
const closeCropperBtn = document.getElementById('closeCropper');
let cropper = null;

// مستمعي الأحداث
document.addEventListener('DOMContentLoaded', function () {
    initializeEventListeners();
    updatePreviewText();
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

    // قص الصورة
    cropImageBtn.addEventListener('click', openCropper);
    confirmCropBtn.addEventListener('click', confirmCrop);
    cancelCropBtn.addEventListener('click', closeCropper);
    closeCropperBtn.addEventListener('click', closeCropper);
    
    // تحسين تجربة نافذة القص - إغلاق بالنقر خارج النافذة
    cropperModal.addEventListener('click', (e) => {
        if (e.target === cropperModal) {
            closeCropper();
        }
    });
    
    // منع إغلاق النافذة عند النقر داخل محتوى النافذة
    const cropperDialog = cropperModal.querySelector('.cropper-dialog');
    if (cropperDialog) {
        cropperDialog.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

// تحديث النصوص في البطاقة
function updatePreviewText() {
    cardEmployeeName.textContent = employeeNameInput.value.trim() || 'اسم الموظف';
    cardJobTitle.textContent = jobTitleInput.value.trim() || 'المسمى الوظيفي';
    cardPhoneNumber.textContent = phoneNumberInput.value.trim() || 'رقم الهاتف';
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
        const finalDataUrl = processedViaApi || originalImageDataUrl;

        displayProcessedImage(finalDataUrl);
        showNotification('تم معالجة الصورة بنجاح!', 'success');

        // ✅ تفعيل زر القص بعد معالجة الصورة بنجاح
        cropImageBtn.disabled = false;

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

async function removeBackgroundWithAPI(_, originalFile) {
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

function displayProcessedImage(dataUrl) {
    processedImageDataUrl = dataUrl;
    processedImage.src = dataUrl;
    processedImage.style.display = 'block';
    photoPlaceholder.style.display = 'none';

    // ✅ تحديث البيانات والصورة فورًا
    updatePreviewText();

    // ✅ فعل أزرار التحميل والمشاركة والقص
    downloadCardBtn.disabled = false;
    shareCardBtn.disabled = false;
    if (cropImageBtn) cropImageBtn.disabled = false;
}

// عند إنشاء البطاقة
async function handleFormSubmit(event) {
    event.preventDefault();
    if (!validateForm()) {
        showNotification('من فضلك املأ جميع البيانات وارفع صورة الموظف', 'error');
        return;
    }

    currentEmployeeData = {
        name: employeeNameInput.value.trim(),
        jobTitle: jobTitleInput.value.trim(),
        phone: phoneNumberInput.value.trim(),
        image: processedImageDataUrl
    };

    // ✅ تحديث البطاقة
    updatePreviewText();
    if (processedImageDataUrl) {
        processedImage.src = processedImageDataUrl;
        processedImage.style.display = "block";
        photoPlaceholder.style.display = "none";
    }

    downloadCardBtn.disabled = false;
    shareCardBtn.disabled = false;

    showNotification('تم إنشاء البطاقة بنجاح!', 'success');
}

function validateForm() {
    return (
        employeeNameInput.value.trim() &&
        jobTitleInput.value.trim() &&
        phoneNumberInput.value.trim() &&
        processedImageDataUrl
    );
}

function handleClearForm() {
    employeeForm.reset();
    processedImageDataUrl = null;
    processedImage.style.display = 'none';
    photoPlaceholder.style.display = 'flex';
    updatePreviewText();
    downloadCardBtn.disabled = true;
    shareCardBtn.disabled = true;
    if (cropImageBtn) cropImageBtn.disabled = true;
}


// --------- تحميل البطاقة بجودة عالية ---------
async function downloadCard() {
    const cardElement = document.getElementById('cardExportArea');
    if (!cardElement) return;

    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }

    try {
        showLoading(true, 'جارِ تحضير البطاقة للتحميل...');

        // 🧩 ثبّت الإطار والصورة مؤقتًا
        const container = cardElement.querySelector('.employee-photo-container');
        const image = cardElement.querySelector('#processedImage');
        const cardRect = cardElement.getBoundingClientRect();
        const rect = container.getBoundingClientRect();

        // حفظ القيم الأصلية
        const originalStyle = {
            position: container.style.position,
            top: container.style.top,
            left: container.style.left,
            transform: container.style.transform,
            width: container.style.width,
            height: container.style.height,
        };

        // ✅ تثبيت الحاوية بالإحداثيات الفعلية
        container.style.position = 'absolute';
        container.style.transform = 'none';
        container.style.top = `${rect.top - cardRect.top}px`;
        container.style.left = `${rect.left - cardRect.left}px`;
        container.style.width = `${rect.width}px`;
        container.style.height = `${rect.height}px`;

        // ✅ تأكد أن الصورة ممتدة بالكامل داخل الإطار
        if (image) {
            image.style.objectFit = 'cover';
            image.style.transform = 'none';
        }

        // تصوير البطاقة
        const canvas = await html2canvas(cardElement, {
            scale: 4,
            useCORS: true,
            backgroundColor: null,
        });

        // 🔄 رجّع القيم الأصلية
        Object.assign(container.style, originalStyle);

        showLoading(false);

        // تحميل الصورة
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const safeName = (employeeNameInput.value.trim() || 'موظف')
            .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `بطاقة_${safeName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification('تم تحميل البطاقة بنجاح!', 'success');
    } catch (error) {
        console.error('خطأ أثناء توليد الصورة:', error);
        showLoading(false);
        showNotification('حدث خطأ أثناء تحميل البطاقة. حاول مرة أخرى.', 'error');
    }
}



// --------- مشاركة على واتساب ---------
async function shareOnWhatsApp() {
    const cardElement = document.getElementById('cardExportArea');
    if (!cardElement) return;

    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }

    try {
        showLoading(true, 'جارِ تحضير البطاقة للمشاركة...');

        // 🧩 ثبّت الإطار والصورة مؤقتًا
        const container = cardElement.querySelector('.employee-photo-container');
        const image = cardElement.querySelector('#processedImage');
        const cardRect = cardElement.getBoundingClientRect();
        const rect = container.getBoundingClientRect();

        // حفظ القيم الأصلية
        const originalStyle = {
            position: container.style.position,
            top: container.style.top,
            left: container.style.left,
            transform: container.style.transform,
            width: container.style.width,
            height: container.style.height,
        };

        // ✅ تثبيت الحاوية بالإحداثيات الفعلية
        container.style.position = 'absolute';
        container.style.transform = 'none';
        container.style.top = `${rect.top - cardRect.top}px`;
        container.style.left = `${rect.left - cardRect.left}px`;
        container.style.width = `${rect.width}px`;
        container.style.height = `${rect.height}px`;

        if (image) {
            image.style.objectFit = 'cover';
            image.style.transform = 'none';
        }

        // تصوير البطاقة
        const canvas = await html2canvas(cardElement, {
            scale: 4,
            useCORS: true,
            backgroundColor: null,
        });

        // 🔄 رجّع القيم الأصلية
        Object.assign(container.style, originalStyle);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        const safeName = (employeeNameInput.value.trim() || 'موظف')
            .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
        const file = new File([blob], `بطاقة_${safeName}.png`, { type: 'image/png' });

        showLoading(false);

        if (navigator.share) {
            await navigator.share({
                files: [file],
                title: 'بطاقة موظف',
                text: `بطاقة الموظف: ${employeeNameInput.value.trim() || 'موظف'}`,
            });
            showNotification('تم مشاركة البطاقة بنجاح!', 'success');
        } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `بطاقة_${safeName}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            const whatsappText = `بطاقة الموظف: ${employeeNameInput.value.trim() || 'موظف'}`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
            window.open(whatsappUrl, '_blank');
            showNotification('تم تحميل البطاقة وفتح واتساب. قم بإرفاق الصورة يدويًا.', 'info');
        }

    } catch (error) {
        console.error('خطأ أثناء مشاركة البطاقة:', error);
        showLoading(false);
        showNotification('حدث خطأ أثناء مشاركة البطاقة. حاول مرة أخرى.', 'error');
    }
}

// --------- قص ---------
async function confirmCrop() {
    if (!cropper) {
        showNotification('لم يتم العثور على محرر الصور', 'error');
        return;
    }

    try {
        showLoading(true, 'جارِ قص الصورة...');

        // نحاول الحصول على canvas أكثر من مرة لو لسه مش جاهز
        let canvas = cropper.getCroppedCanvas({
            width: 1200,
            height: 1200,
            fillColor: '#ffffff',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });

        if (!canvas) {
            await new Promise(r => setTimeout(r, 150)); // ننتظر 150 مللي ثانية
            canvas = cropper.getCroppedCanvas({
                width: 1200,
                height: 1200,
                fillColor: '#ffffff',
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });
        }

        if (!canvas) {
            showNotification('تعذر قص الصورة. حاول مرة أخرى.', 'error');
            showLoading(false);
            return;
        }

        const dataUrl = canvas.toDataURL('image/png', 1.0);
        processedImageDataUrl = dataUrl;
        processedImage.src = dataUrl;

        // إعادة تعيين الوضع
        currentX = 0;
        currentY = 0;
        scale = 1;
        updateTransform();

        // تفعيل الأزرار
        downloadCardBtn.disabled = false;
        shareCardBtn.disabled = false;
        if (cropImageBtn) cropImageBtn.disabled = false;

        showLoading(false);
        showNotification('تم قص الصورة بنجاح ✨', 'success');
    } catch (error) {
        console.error('خطأ في قص الصورة:', error);
        showLoading(false);
        showNotification('حدث خطأ أثناء قص الصورة. حاول مرة أخرى.', 'error');
    } finally {
        closeCropper();
    }
}




// --------- إشعارات ---------
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
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.25s ease';
        setTimeout(() => notification.remove(), 250);
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

function showLoading(show, message = '') {
    if (!loadingOverlay) return;
    loadingOverlay.style.display = show ? 'flex' : 'none';
    if (show && message) {
        loadingOverlay.querySelector('p').textContent = message;
    }
}

// ============ تحكم في صورة الموظف (سحب + تكبير/تصغير) ============
const photoContainer = document.querySelector(".employee-photo-container");
const photo = document.getElementById("processedImage");

let isDragging = false;
let startX, startY;
let currentX = 0, currentY = 0;
let scale = 1;

// Mouse events
photoContainer.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX - currentX;
    startY = e.clientY - currentY;
    photo.style.cursor = "grabbing";
});

window.addEventListener("mouseup", () => {
    isDragging = false;
    photo.style.cursor = "grab";
});

window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    currentX = e.clientX - startX;
    currentY = e.clientY - startY;
    updateTransform();
});

// Scroll zoom (PC)
photoContainer.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale += e.deltaY * -0.001;
    scale = Math.min(Math.max(0.5, scale), 3);
    updateTransform();
});

// Touch events (Mobile)
let initialDistance = 0;
let initialScale = 1;

photoContainer.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
        isDragging = true;
        startX = e.touches[0].clientX - currentX;
        startY = e.touches[0].clientY - currentY;
    } else if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        initialScale = scale;
    }
});

photoContainer.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
        currentX = e.touches[0].clientX - startX;
        currentY = e.touches[0].clientY - startY;
        updateTransform();
    } else if (e.touches.length === 2) {
        const newDistance = getDistance(e.touches[0], e.touches[1]);
        scale = initialScale * (newDistance / initialDistance);
        scale = Math.min(Math.max(0.5, scale), 3);
        updateTransform();
    }
});

photoContainer.addEventListener("touchend", () => {
    isDragging = false;
});

function updateTransform() {
    photo.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
}

function getDistance(touch1, touch2) {
    return Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
    );
}

