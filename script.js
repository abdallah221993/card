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
    const exportRoot = document.getElementById('cardExportArea');
    if (!exportRoot) return;

    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }

    try {
        showLoading(true, 'جارِ تحضير البطاقة للتحميل...');

        // ✅ اعمل نسخة جديدة من البطاقة
        const clone = exportRoot.cloneNode(true);
        clone.id = "cardExportClone";

        // إعداد النسخة المخفية
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.top = '0';
        clone.style.zIndex = '-1';
        clone.style.width = '600px';
        clone.style.height = '600px';
        clone.style.visibility = 'visible';

        // ثبّت الحاوية والإطار والصورة يدويًا لتفادي الحركة
        const cloneContainer = clone.querySelector(".employee-photo-container");
        const cloneImage = clone.querySelector("#processedImage");

        if (cloneContainer) {
            cloneContainer.style.position = "absolute";
            cloneContainer.style.top = "50%";
            cloneContainer.style.left = "50%";
            cloneContainer.style.width = "360px";
            cloneContainer.style.height = "360px";
            cloneContainer.style.transform = "translate(-50%, -50%)";
            cloneContainer.style.borderRadius = "50%";
            cloneContainer.style.overflow = "hidden";
            cloneContainer.style.border = "3px solid #8e1d1d";
            cloneContainer.style.display = "flex";
            cloneContainer.style.alignItems = "center";
            cloneContainer.style.justifyContent = "center";
            cloneContainer.style.background = "#d9d9d9";
            cloneContainer.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.35)";
            cloneContainer.style.cursor = "default";
            cloneContainer.style.userSelect = "none";
            cloneContainer.style.pointerEvents = "none";
        }

        if (cloneImage && processedImageDataUrl) {
            cloneImage.src = processedImageDataUrl;
            cloneImage.style.display = "block";
            cloneImage.style.position = "absolute";
            cloneImage.style.inset = "0";
            cloneImage.style.width = "100%";
            cloneImage.style.height = "100%";
            cloneImage.style.objectFit = "cover";
            cloneImage.style.transform = "none";
            cloneImage.style.cursor = "default";
            cloneImage.style.zIndex = "2";
        }

        // تحديث النصوص
        const cloneName = clone.querySelector('#cardEmployeeName');
        const cloneTitle = clone.querySelector('#cardJobTitle');
        const clonePhone = clone.querySelector('#cardPhoneNumber');

        if (cloneName) cloneName.textContent = employeeNameInput.value.trim() || 'اسم الموظف';
        if (cloneTitle) cloneTitle.textContent = jobTitleInput.value.trim() || 'المسمى الوظيفي';
        if (clonePhone) clonePhone.textContent = phoneNumberInput.value.trim() || 'رقم الهاتف';

        document.body.appendChild(clone);
        await new Promise(resolve => setTimeout(resolve, 150));

        const canvas = await html2canvas(clone, {
            scale: 3,
            useCORS: true,
            allowTaint: false,
            backgroundColor: null,
            width: 600,
            height: 600,
            scrollX: 0,
            scrollY: 0
        });

        document.body.removeChild(clone);
        showLoading(false);

        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const safeName = (employeeNameInput.value.trim() || 'موظف').replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');

        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
                const file = new File([blob], `بطاقة_${safeName}.png`, { type: 'image/png' });
                await navigator.share({
                    files: [file],
                    title: 'بطاقة موظف',
                    text: 'بطاقة الموظف جاهزة'
                });
            } else {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `بطاقة_${safeName}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }

            showNotification('تم تحميل البطاقة بنجاح!', 'success');
        } catch (shareError) {
            console.error('فشل في المشاركة، سيتم التحميل العادي:', shareError);
            const link = document.createElement('a');
            link.download = `بطاقة_${safeName}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification('تم تحميل البطاقة بنجاح!', 'success');
        }

    } catch (error) {
        console.error('خطأ أثناء توليد الصورة:', error);
        showLoading(false);
        showNotification('حدث خطأ أثناء تحميل البطاقة. حاول مرة أخرى.', 'error');
    }
}



// --------- مشاركة على واتساب ---------
async function shareOnWhatsApp() {
    try {
        showLoading(true, 'جارِ تحضير البطاقة للمشاركة...');

        const exportRoot = document.getElementById('cardExportArea');
        if (!exportRoot) {
            showNotification('خطأ في العثور على البطاقة', 'error');
            return;
        }

        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }

        const clone = exportRoot.cloneNode(true);
        clone.id = "cardShareClone";

        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.top = '0';
        clone.style.zIndex = '-1';
        clone.style.width = '600px';
        clone.style.height = '600px';
        clone.style.visibility = 'visible';

        const cloneContainer = clone.querySelector(".employee-photo-container");
        const cloneImage = clone.querySelector("#processedImage");

        if (cloneContainer) {
            cloneContainer.style.position = "absolute";
            cloneContainer.style.top = "50%";
            cloneContainer.style.left = "50%";
            cloneContainer.style.width = "360px";
            cloneContainer.style.height = "360px";
            cloneContainer.style.transform = "translate(-50%, -50%)";
            cloneContainer.style.borderRadius = "50%";
            cloneContainer.style.overflow = "hidden";
            cloneContainer.style.border = "3px solid #8e1d1d";
            cloneContainer.style.display = "flex";
            cloneContainer.style.alignItems = "center";
            cloneContainer.style.justifyContent = "center";
            cloneContainer.style.background = "#d9d9d9";
            cloneContainer.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.35)";
            cloneContainer.style.cursor = "default";
            cloneContainer.style.userSelect = "none";
            cloneContainer.style.pointerEvents = "none";
        }

        if (cloneImage && processedImageDataUrl) {
            cloneImage.src = processedImageDataUrl;
            cloneImage.style.display = "block";
            cloneImage.style.position = "absolute";
            cloneImage.style.inset = "0";
            cloneImage.style.width = "100%";
            cloneImage.style.height = "100%";
            cloneImage.style.objectFit = "cover";
            cloneImage.style.transform = "none";
            cloneImage.style.cursor = "default";
            cloneImage.style.zIndex = "2";
        }

        const cloneName = clone.querySelector('#cardEmployeeName');
        const cloneTitle = clone.querySelector('#cardJobTitle');
        const clonePhone = clone.querySelector('#cardPhoneNumber');

        if (cloneName) cloneName.textContent = employeeNameInput.value.trim() || 'اسم الموظف';
        if (cloneTitle) cloneTitle.textContent = jobTitleInput.value.trim() || 'المسمى الوظيفي';
        if (clonePhone) clonePhone.textContent = phoneNumberInput.value.trim() || 'رقم الهاتف';

        document.body.appendChild(clone);
        await new Promise(resolve => setTimeout(resolve, 150));

        const canvas = await html2canvas(clone, {
            scale: 3,
            useCORS: true,
            backgroundColor: null,
            width: 600,
            height: 600
        });

        document.body.removeChild(clone);
        showLoading(false);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        const safeName = (employeeNameInput.value.trim() || 'موظف').replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
        const file = new File([blob], `بطاقة_${safeName}.png`, { type: 'image/png' });

        if (navigator.share) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'بطاقة موظف',
                    text: `بطاقة الموظف: ${employeeNameInput.value.trim() || 'موظف'}`
                });
                showNotification('تم مشاركة البطاقة بنجاح!', 'success');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('خطأ في المشاركة:', err);
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `بطاقة_${safeName}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    showNotification('تم تحميل البطاقة عوضًا عن المشاركة', 'success');
                }
            }
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
        console.error('خطأ في مشاركة البطاقة:', error);
        showLoading(false);
        showNotification('حدث خطأ أثناء مشاركة البطاقة. حاول مرة أخرى.', 'error');
    }
}






// --------- نافذة القص المحسّنة ---------
function openCropper() {
    if (!processedImageDataUrl) {
        showNotification('من فضلك ارفع صورة أولاً لقصّها', 'warning');
        return;
    }
    
    // عرض النافذة مع تأثير انيميشن
    cropperModal.classList.add('show');
    cropperModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // منع التمرير في الخلفية
    
    // تهيئة الصورة للمحرر مع تحسينات
    cropperImage.onload = () => {
        // تنظيف المحرر السابق إن وجد
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        
        // انتظار قصير لضمان عرض الصورة
        setTimeout(() => {
            cropper = new Cropper(cropperImage, {
                aspectRatio: 1, // نسبة 1:1 للدائرة
                viewMode: 1, // تقييد منطقة القص داخل الاطار
                background: false, // إزالة الخلفية الشطرنجية
                autoCropArea: 0.8, // منطقة القص الافتراضية
                movable: true, // يمكن تحريك الصورة
                zoomable: true, // يمكن التكبير/التصغير
                rotatable: true, // يمكن الدوران
                scalable: true, // يمكن التمديد
                responsive: true, // يتجاوب مع تغيير حجم النافذة
                checkCrossOrigin: false,
                checkOrientation: false,
                modal: true, // عرض القناع فوق الصورة
                guides: true, // عرض الخطوط المرشدة
                center: true, // عرض مركز القص
                highlight: false, // إزالة تمييز منطقة القص
                cropBoxMovable: true, // يمكن تحريك صندوق القص
                cropBoxResizable: true, // يمكن تغيير حجم صندوق القص
                toggleDragModeOnDblclick: false,
                ready() {
                    // تطبيق زر CSS لجعل منطقة القص دائرية
                    const viewBox = cropperModal.querySelector('.cropper-view-box');
                    const face = cropperModal.querySelector('.cropper-face');
                    if (viewBox) viewBox.style.borderRadius = '50%';
                    if (face) face.style.borderRadius = '50%';
                }
            });
        }, 100);
    };
    
    cropperImage.onerror = () => {
        showNotification('فشل في تحميل الصورة للقص', 'error');
        closeCropper();
    };
    
    cropperImage.src = processedImageDataUrl;
}

function closeCropper() {
    // تنظيف المحرر
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    
    // إغلاق النافذة مع تأثير
    cropperModal.classList.remove('show');
    cropperModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // إعادة التمرير
    
    // مسح مصدر الصورة لتوفير الذاكرة
    cropperImage.src = '';
}

async function confirmCrop() {
    if (!cropper) {
        showNotification('لم يتم العثور على محرر الصور', 'error');
        return;
    }
    
    try {
        showLoading(true, 'جارِ قص الصورة...');
        
        // الحصول على الصورة المقصوصة بجودة عالية
        const canvas = cropper.getCroppedCanvas({
            width: 1200, // حجم أكبر لجودة أفضل
            height: 1200,
            minWidth: 400, // حد أدنى للجودة
            minHeight: 400,
            maxWidth: 2048, // حد أقصى لمنع مشاكل الذاكرة
            maxHeight: 2048,
            fillColor: '#ffffff', // خلفية بيضاء للمناطق الشفافة
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });
        
        if (!canvas) {
            throw new Error('فشل في إنشاء الصورة المقصوصة');
        }
        
        // تحويل إلى Data URL بجودة عالية
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        
        // تحديث الصورة المعالجة
        processedImageDataUrl = dataUrl;
        processedImage.src = dataUrl;
        
        // إعادة تعيين موضع وحجم الصورة في البطاقة
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

// إغلاق بالضغط على Escape
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cropperModal.classList.contains('show')) {
        closeCropper();
    }
});


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

