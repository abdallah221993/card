// Stub for BackgroundRemover to avoid 404 errors in preview
// This class is not used by current flow, but kept for compatibility.
class BackgroundRemover {
    async removeBackground(imageDataUrl) {
        // Return the same image without modification
        return imageDataUrl;
    }
}
