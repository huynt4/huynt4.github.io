document.addEventListener('DOMContentLoaded', () => {
    // 1. Lấy tham chiếu đến nút bấm
    const loadBtn = document.getElementById('loadComicsBtn');
    // 2. Lấy tham chiếu đến vùng chứa danh sách truyện
    const comicsContainer = document.getElementById('comicsContainer');
    const statusEl = document.getElementById('status');
    
    // Hàm chính để tải và hiển thị danh sách
    const loadComics = async () => {
        statusEl.textContent = 'Đang tải danh sách...';
        
        try {
            // Sử dụng API Fetch để đọc tệp tin comics.json
            // Tệp này phải được bạn tạo và cập nhật thủ công
            const response = await fetch('comics.json');
            
            // Kiểm tra xem việc tải có thành công không
            if (!response.ok) {
                throw new Error(`Lỗi HTTP: ${response.status}`);
            }
            
            // Chuyển đổi dữ liệu nhận được thành đối tượng JavaScript
            const comics = await response.json();
            
            // Xóa nội dung cũ
            comicsContainer.innerHTML = ''; 
            
            if (comics.length === 0) {
                comicsContainer.innerHTML = '<p>Không tìm thấy truyện nào.</p>';
                statusEl.textContent = 'Đã tải: 0 truyện.';
                return;
            }

            // Lặp qua từng truyện và tạo phần tử HTML
            comics.forEach(comic => {
                const comicDiv = document.createElement('div');
                comicDiv.classList.add('comic-item');
                
                // Tạo liên kết đến trang xem truyện (chưa tạo trang này)
                // Giả sử trang xem truyện là "viewer.html?folder=TenTruyenA"
                const comicLink = document.createElement('a');
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
            
            statusEl.textContent = `Đã tải: ${comics.length} truyện.`;

        } catch (error) {
            console.error('Lỗi khi tải danh sách truyện:', error);
            comicsContainer.innerHTML = '<p class="error">❌ Lỗi: Không thể tải danh sách truyện (kiểm tra tệp comics.json).</p>';
            statusEl.textContent = 'Tải thất bại.';
        }
    };

    // 4. Gán sự kiện cho nút bấm
    loadBtn.addEventListener('click', loadComics);

    // * Tải danh sách truyện ngay khi trang load xong (Tùy chọn)
    // loadComics(); 
});