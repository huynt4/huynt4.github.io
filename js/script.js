// Khai báo biến
const colorPickers = document.querySelectorAll('#colorPicker');
const slides = document.querySelectorAll('.photo-slider .photo');
const slideInterval = 2000; // 2 giây = 2000ms

let currentSlide = 0;

// =========================================================
// CHỨC NĂNG 1: SLIDE SHOW ẢNH TỰ ĐỘNG
// =========================================================
function nextSlide() {
    // Ẩn slide hiện tại
    slides[currentSlide].classList.remove('active');

    // Chuyển sang slide tiếp theo
    currentSlide = (currentSlide + 1) % slides.length;

    // Hiển thị slide mới
    slides[currentSlide].classList.add('active');
}

// Bắt đầu chạy slide show
if (slides.length > 0) {
    // Chỉ chạy nếu có ít nhất 1 ảnh
    slides[0].classList.add('active'); // Đảm bảo ảnh đầu tiên hiển thị khi load
    setInterval(nextSlide, slideInterval);
}


// =========================================================
// CHỨC NĂNG 2: ĐIỀU CHỈNH MÀU SẮC
// =========================================================
colorPickers.forEach(picker => {
    picker.addEventListener('input', (event) => {
        const newColor = event.target.value;
        // 1. Cập nhật biến CSS
        document.documentElement.style.setProperty('--base-color', newColor);

        // 2. Đồng bộ giá trị màu giữa hai picker (fixed và static)
        colorPickers.forEach(otherPicker => {
            if (otherPicker !== event.target) {
                otherPicker.value = newColor;
            }
        });
    });
});