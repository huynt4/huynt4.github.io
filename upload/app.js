/*
const pwStatus = document.getElementById('pw_status');


const authorizeButton = document.getElementById("authorize_button");
const loginApiButton = document.getElementById('login_api_button');
const signoutButton = document.getElementById("signout_button");
const authStatus = document.getElementById("auth_status");


const uploadButton = document.getElementById("upload_button");
const uploadStatus = document.getElementById("upload_status");
const uploadProgress = document.getElementById('upload_progress');
const fileInput = document.getElementById("file_input");


const listButton = document.getElementById("list_button");
const listWithReadonly = document.getElementById('list_with_readonly');
const listStatus = document.getElementById("list_status");
const filesTbody = document.getElementById("files_tbody");


// ---- Password utilities (SHA-256 via SubtleCrypto) ----
async function sha256hex(str) {
const enc = new TextEncoder();
const data = enc.encode(str);
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
const hashArray = Array.from(new Uint8Array(hashBuffer));
return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
}


function storedHash() { return localStorage.getItem('drive_app_pw_hash'); }


setPwBtn.addEventListener('click', async () => {
const pw = pwInput.value || '';
if (!pw) { pwStatus.textContent = 'Vui lòng nhập mật khẩu để lưu.'; pwStatus.className='status error'; return; }
const h = await sha256hex(pw);
localStorage.setItem('drive_app_pw_hash', h);
pwStatus.textContent = 'Đã lưu hash mật khẩu vào localStorage.'; pwStatus.className='status success';
pwInput.value = '';
});


unlockPwBtn.addEventListener('click', async () => {
const pw = pwInput.value || '';
if (!pw) { pwStatus.textContent = 'Nhập mật khẩu để mở khóa.'; pwStatus.className='status error'; return; }
const h = await sha256hex(pw);
const stored = storedHash();
if (!stored) {
pwStatus.textContent = 'Chưa có mật khẩu nào được đặt. Nhấn "Đặt / Lưu mật khẩu" nếu muốn tạo.'; pwStatus.className='status error';
return;
}
if (h === stored) {
unlocked = true;
document.getElementById('login_buttons_row').style.display = 'flex';
authorizeButton.disabled = false;
loginApiButton.disabled = false;
pwStatus.textContent = 'Mở khóa thành công — bạn có thể chọn phương thức đăng nhập.'; pwStatus.className='status success';
pwInput.value = '';
} else {
pwStatus.textContent = 'Mật khẩu không đúng.'; pwStatus.className='status error';
}
});


clearPwBtn.addEventListener('click', () => {
localStorage.removeItem('drive_app_pw_hash');
pwStatus.textContent = 'Đã xóa mật khẩu (hash) khỏi localStorage.'; pwStatus.className='status';
});


// ---- Google APIs init ----
function gapiLoaded() { gapi.load('client', initializeGapi