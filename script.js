// script.js (نسخة نهائية بدون remove.bg أو أي أكواد أو إشارات متعلقة بها)

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
        displayProcessedImage(originalImageDataUrl);
        showNotification('تم معالجة الصورة بنجاح!', 'success');
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

function displayProcessedImage(dataUrl) {
    processedImageDataUrl = dataUrl;
    processedImage.src = dataUrl;
    processedImage.style.display = 'block';
    photoPlaceholder.style.display = 'none';

    updatePreviewText();

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

    // === الحل: ضبط الاتجاه وخصائص النص للبطاقة وكل عناصرها ===
    cardElement.setAttribute('dir', 'rtl');
    cardElement.style.direction = "rtl";
    cardElement.style.unicodeBidi = "isolate";
    // لو حابب تأكد أكثر، أضف لكل عناصر النص داخل البطاقة:
    const nameElem = cardElement.querySelector('#cardEmployeeName');
    if (nameElem) {
        nameElem.setAttribute('dir', 'rtl');
        nameElem.style.direction = "rtl";
        nameElem.style.unicodeBidi = "isolate";
    }

    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }

    try {
        showLoading(true, 'جارِ تحضير البطاقة للتحميل...');

        // ثبّت الإطار والصورة مؤقتًا
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

        // تثبيت الحاوية بالإحداثيات الفعلية
        container.style.position = 'absolute';
        container.style.transform = 'none';
        container.style.top = `${rect.top - cardRect.top}px`;
        container.style.left = `${rect.left - cardRect.left}px`;
        container.style.width = `${rect.width}px`;
        container.style.height = `${rect.height}px`;

        // تأكد أن الصورة ممتدة بالكامل داخل الإطار
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

        // رجّع القيم الأصلية
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

        // ثبّت الإطار والصورة مؤقتًا
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

        // تثبيت الحاوية بالإحداثيات الفعلية
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

        // رجّع القيم الأصلية
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
    if (!cropper || !cropperModal.classList.contains('show')) {
        console.warn('⚠️ لا يمكن تنفيذ القص — cropper غير جاهز أو النافذة مغلقة.');
        return;
    }

    try {
        showLoading(true, 'جارِ قص الصورة...');

        let canvas = cropper.getCroppedCanvas({
            width: 1200,
            height: 1200,
            fillColor: '#ffffff',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });

        if (!canvas) {
            await new Promise(r => setTimeout(r, 150));
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

// --------- نافذة القص الآمنة ---------
function openCropper() {
    console.log("✅ تم الضغط على زر القص");

    if (!processedImageDataUrl || typeof processedImageDataUrl !== "string") {
        showNotification("من فضلك ارفع صورة أولاً لقصّها", "warning");
        return;
    }

    if (cropperModal.classList.contains("show")) return;

    cropperModal.classList.add("show");
    cropperModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (!processedImageDataUrl.startsWith("data:image")) {
        showNotification("الصورة غير جاهزة للقص بعد. حاول إعادة رفعها.", "error");
        closeCropper();
        return;
    }

    cropperImage.onload = null;
    cropperImage.onerror = null;

    cropperImage.src = "";
    cropperImage.src = processedImageDataUrl;

    cropperImage.onload = () => {
        console.log("📸 تم تحميل الصورة داخل أداة القص بنجاح");

        if (cropper) {
            cropper.destroy();
            cropper = null;
        }

        cropper = new Cropper(cropperImage, {
            aspectRatio: 1,
            viewMode: 1,
            background: false,
            autoCropArea: 0.85,
            movable: true,
            zoomable: true,
            rotatable: false,
            scalable: false,
            responsive: true,
            checkCrossOrigin: false,
            modal: true,
            guides: true,
            highlight: false,
            center: true,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            ready() {
                const viewBox = cropperModal.querySelector(".cropper-view-box");
                const face = cropperModal.querySelector(".cropper-face");
                if (viewBox) viewBox.style.borderRadius = "50%";
                if (face) face.style.borderRadius = "50%";
            },
        });
    };

    cropperImage.onerror = (err) => {
        console.error("❌ فشل تحميل الصورة داخل cropper:", err);
        showNotification("تعذر تحميل الصورة للقص. يرجى إعادة رفعها.", "error");

        cropperImage.onload = null;
        cropperImage.onerror = null;
        cropperImage.src = "";
        closeCropper();
    };
}

function closeCropper() {
    try {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    } catch (err) {
        console.warn("⚠️ خطأ أثناء تدمير cropper:", err);
    }

    cropperModal.classList.remove('show');
    cropperModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    cropperImage.src = '';
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