// خدمة إزالة الخلفية المحسنة
class BackgroundRemover {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    // إزالة الخلفية باستخدام معالجة الصور المحلية
    async removeBackground(imageDataUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.processImage(img, resolve);
            };
            img.src = imageDataUrl;
        });
    }

    processImage(img, callback) {
        // تحديد حجم الكانفاس
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        
        // رسم الصورة
        this.ctx.drawImage(img, 0, 0);
        
        // الحصول على بيانات الصورة
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        // معالجة محسنة للصورة
        this.enhanceImage(data);
        
        // إعادة رسم البيانات المعدلة
        this.ctx.putImageData(imageData, 0, 0);
        
        // تحويل إلى Data URL
        callback(this.canvas.toDataURL('image/png'));
    }

    enhanceImage(data) {
        for (let i = 0; i < data.length; i += 4) {
            const red = data[i];
            const green = data[i + 1];
            const blue = data[i + 2];
            
            // تحسين التباين والسطوع
            data[i] = this.enhanceChannel(red);
            data[i + 1] = this.enhanceChannel(green);
            data[i + 2] = this.enhanceChannel(blue);
            
            // تحسين الشفافية للخلفيات الفاتحة
            if (this.isBackgroundPixel(red, green, blue)) {
                data[i + 3] = Math.max(0, data[i + 3] - 50); // تقليل الشفافية
            }
        }
    }

    enhanceChannel(value) {
        // تحسين التباين
        const contrast = 1.2;
        const brightness = 10;
        
        let enhanced = (value - 128) * contrast + 128 + brightness;
        return Math.max(0, Math.min(255, enhanced));
    }

    isBackgroundPixel(r, g, b) {
        // كشف الخلفيات الفاتحة (أبيض، رمادي فاتح)
        const brightness = (r + g + b) / 3;
        return brightness > 200;
    }

    // تطبيق فلتر تنعيم
    applySmoothingFilter(data, width, height) {
        const newData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                
                // تطبيق فلتر 3x3 للتنعيم
                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const neighborIdx = ((y + dy) * width + (x + dx)) * 4 + c;
                            sum += data[neighborIdx];
                        }
                    }
                    newData[idx + c] = sum / 9;
                }
            }
        }
        
        return newData;
    }
}

// تصدير الفئة للاستخدام في الملف الرئيسي
window.BackgroundRemover = BackgroundRemover;