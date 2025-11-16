// --- CẤU HÌNH CHUNG ---
const MAX_PAGES = 999; 
const COMIC_ROOT_FOLDER = "Comic/"; 

// Hàm gán sự kiện sau khi trang index.html tải xong
document.addEventListener('DOMContentLoaded', () => {
    // Chỉ chạy logic danh sách truyện nếu đang ở trang index.html
    if (document.getElementById('loadComicsBtn')) {
        initializeIndexPage();
    } 
    // Logic cho trang viewer.html được gọi trực tiếp trong viewer.html
});


// --- PHẦN 1: XỬ LÝ TRANG DANH SÁCH (index.html) ---

const initializeIndexPage = () => {
    const loadBtn = document.getElementById('loadComicsBtn');
    const comicsContainer = document.getElementById('comicsContainer');
    const statusEl = document.getElementById('status');
    
    // Gán sự kiện cho nút bấm "Tải Danh Sách Truyện"
    loadBtn.addEventListener('click', loadComics);
};

const loadComics = async () => {
    const comicsContainer = document.getElementById('comicsContainer');
    const statusEl = document.getElementById('status');

    statusEl.textContent = 'Đang tải danh sách...';
    
    try {
        // Tải tệp cấu hình JSON
        const response = await fetch('comics.json');
        
        if (!response.ok) {
            throw new Error(`Lỗi HTTP: ${response.status}`);
        }
        
        const comics = await response.json();
        
        comicsContainer.innerHTML = ''; 
        
        if (comics.length === 0) {
            comicsContainer.innerHTML = '<p>Không tìm thấy truyện nào.</p>';
            statusEl.textContent = 'Đã tải: 0 truyện.';
            return;
        }

        // Tạo HTML cho từng truyện
        comics.forEach(comic => {
            const comicDiv = document.createElement('div');
            comicDiv.classList.add('comic-item');
            
            const comicLink = document.createElement('a');
            // Liên kết đến trang xem truyện (viewer.html) và truyền tên thư mục (folder) qua URL
            comicLink.href = `viewer.html?folder=${comic.folder}`; 
            comicLink.innerHTML = `
                <h3>${comic.title}</h3>
                <p><strong>Ngày tải lên:</strong> ${comic.upload_date}</p>
                <p>${comic.description}</p>
                <p class="view-link">Xem ngay &rarr;</p>
            `;

            comicDiv.appendChild(comicLink);
            comicsContainer.appendChild(comicDiv);
        });
        
        statusEl.textContent = `✅ Đã tải: ${comics.length} truyện.`;

    } catch (error) {
        console.error('Lỗi khi tải danh sách truyện:', error);
        comicsContainer.innerHTML = '<p class="error">❌ Lỗi: Không thể tải danh sách truyện (kiểm tra tệp comics.json).</p>';
        statusEl.textContent = 'Tải thất bại.';
    }
};


// ----------------------------------------------------------------------
// --- PHẦN 2: XỬ LÝ TRANG XEM TRUYỆN (viewer.html) ---

/**
 * Hàm chính để tải và hiển thị các trang truyện
 * Hàm này được gọi trong viewer.html
 */
const loadComicPages = async () => {
    const params = new URLSearchParams(window.location.search);
    // Lấy tên thư mục truyện từ tham số 'folder' trong URL
    const folderName = params.get('folder'); 

    const titleEl = document.getElementById('comicTitle');
    const viewer = document.getElementById('viewerContainer');
    
    // Kiểm tra xem có tên thư mục truyện không
    if (!folderName) {
        titleEl.textContent = '❌ Lỗi: Không tìm thấy tên truyện.';
        viewer.innerHTML = 'Vui lòng quay lại trang danh sách.';
        return;
    }

    // Tải comics.json để lấy tên truyện chính thức (tùy chọn)
    try {
        const response = await fetch('comics.json');
        const comics = await response.json();
        const currentComic = comics.find(c => c.folder === folderName);
        titleEl.textContent = currentComic ? currentComic.title : `Đang xem: ${folderName}`;
    } catch (e) {
        titleEl.textContent = `Đang xem: ${folderName}`;
    }

    viewer.innerHTML = '<p id="status-viewer">Đang tìm và tải các trang truyện...</p>';
    const statusViewerEl = document.getElementById('status-viewer');
    let pagesLoaded = 0;

    // Lặp qua số trang tối đa để tìm tệp ảnh
    for (let i = 1; i <= MAX_PAGES; i++) {
        // Định dạng số trang thành 5 chữ số (ví dụ: 1 -> "001", 10 -> "010")
        const pageNumber = i.toString().padStart(5, '0');
        
        const basePath = `${COMIC_ROOT_FOLDER}${folderName}/${pageNumber}`;

        // Thử tải tệp .jpg
        if (await tryLoadImage(`${basePath}.jpg`, viewer)) {
            pagesLoaded++;
            statusViewerEl.textContent = `Đã tải ${pagesLoaded} trang...`;
            continue;
        }

        // Thử tải tệp .png
        if (await tryLoadImage(`${basePath}.png`, viewer)) {
            pagesLoaded++;
            statusViewerEl.textContent = `Đã tải ${pagesLoaded} trang...`;
            continue;
        }
        
        // Nếu đã tải được ít nhất 1 trang mà không tìm thấy trang tiếp theo thì dừng
        if (pagesLoaded > 0) { 
            break;
        }
    }
    
    // Hiển thị kết quả cuối cùng
    if (pagesLoaded === 0) {
        viewer.innerHTML = '<p class="error">❌ Lỗi: Không tìm thấy trang nào trong thư mục này. Kiểm tra lại tên tệp ảnh (phải là 001.jpg/001.png, 002.jpg/002.png...).</p>';
    } else {
        statusViewerEl.textContent = `✅ Hoàn tất tải ${pagesLoaded} trang.`;
    }
};

/**
 * Hàm kiểm tra xem một ảnh có tồn tại và hiển thị nó hay không
 */
const tryLoadImage = (url, container) => {
    return new Promise(resolve => {
        const img = document.createElement('img');
        img.classList.add('comic-page');
        img.loading = 'lazy'; // Tối ưu hóa việc tải ảnh
        
        img.onload = () => {
            // Ảnh tải thành công: chèn vào trang
            container.appendChild(img);
            resolve(true);
        };
        
        img.onerror = () => {
            // Ảnh không tồn tại (lỗi 404)
            resolve(false);
        };
        
        // Bắt đầu tải ảnh
        img.src = url;
    });
};