// TODO: THAY BẰNG THÔNG TIN THẬT CỦA BẠN ---------------
    const CLIENT_ID = "957298442128-v4c9rc83fud515f2is92p97lojjoiuja.apps.googleusercontent.com"; // OAuth 2.0 Client ID
    const API_KEY = "AIzaSyCxJzJVa5OUlnPDKvyxiUqkIJGQ8-hxZtU"; // API key

    // Scope: quyền truy cập file tạo bởi app
    const SCOPES = "https://www.googleapis.com/auth/drive.file";
    const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
    // -------------------------------------------------------

    let tokenClient;
    let gapiInited = false;
    let gisInited = false;
	
	// ---- Password gate (client-side) ----
	let unlocked = false; // chỉ mở khi mật khẩu đúng

	// DOM cho mật khẩu (nếu bạn đã chèn HTML)
	const securePasswordInput = document.getElementById('secure_password');
	const checkPasswordButton = document.getElementById('check_password_button');
	const clearPasswordButton = document.getElementById('clear_password_button');
	const passwordStatus = document.getElementById('password_status');
	const loginApiButton = document.getElementById('login_api_button'); // nút API (thêm vào HTML)

	// Helper: SHA-256 -> hex (Web Crypto)
	async function sha256hex(str) {
	  const enc = new TextEncoder();
	  const data = enc.encode(str);
	  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	  const hashArray = Array.from(new Uint8Array(hashBuffer));
	  return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
	}

	// Lấy hash đã lưu (nếu bạn muốn lưu hash khi user "set pw")
	function storedHash() { return localStorage.getItem('drive_app_pw_hash') || '5be803e5a0a473fc61b7ef05579acee57c90fb42d3c229ad77a64013a50c0b70'; }

	// Xử lý nút xác nhận mật khẩu
	if (checkPasswordButton) {
	  checkPasswordButton.addEventListener('click', async () => {
		const val = (securePasswordInput && securePasswordInput.value) ? securePasswordInput.value : '';
		if (!val) {
		  passwordStatus.textContent = 'Nhập mật khẩu để mở khóa.';
		  passwordStatus.className = 'status error';
		  return;
		}
		const h = await sha256hex(val);
		const stored = storedHash();
		if (!stored) {
		  // Nếu chưa có hash, thông báo cho user, hoặc bạn có thể tự lưu hash bằng nút "Đặt / Lưu"
		  passwordStatus.textContent = 'Chưa có mật khẩu nào được đặt. Hãy dùng chức năng đặt mật khẩu trước.';
		  passwordStatus.className = 'status error';
		  return;
		}
		if (h === stored) {
		  unlocked = true;
		  // Hiện các nút login (nếu ẩn bằng display:none)
		  if (authorizeButton) { authorizeButton.style.display = 'inline-flex'; authorizeButton.disabled = false; }
		  if (loginApiButton) { loginApiButton.style.display = 'inline-flex'; loginApiButton.disabled = false; }
		  passwordStatus.textContent = 'Mở khóa thành công.';
		  passwordStatus.className = 'status success';
		  // cập nhật trạng thái auth nếu gapi/gis đã sẵn sàng
		  maybeEnableAuthButton();
		} else {
		  passwordStatus.textContent = 'Mật khẩu không đúng.';
		  passwordStatus.className = 'status error';
		}
	  });
	}

	// Xóa hash (nếu bạn muốn nút clear)
	if (clearPasswordButton) {
	  clearPasswordButton.addEventListener('click', () => {
		localStorage.removeItem('drive_app_pw_hash');
		passwordStatus.textContent = 'Đã xóa mật khẩu (hash) khỏi localStorage.';
		passwordStatus.className = 'status';
	  });
	}


    const authorizeButton = document.getElementById("authorize_button");
    const signoutButton = document.getElementById("signout_button");
    const authStatus = document.getElementById("auth_status");

    const uploadButton = document.getElementById("upload_button");
    const uploadStatus = document.getElementById("upload_status");
    const fileInput = document.getElementById("file_input");

    const listButton = document.getElementById("list_button");
    const listStatus = document.getElementById("list_status");
    const filesTbody = document.getElementById("files_tbody");

    // Gọi khi api.js load xong
    function gapiLoaded() {
      gapi.load("client", initializeGapiClient);
    }

    // Khởi tạo client của Google API
    async function initializeGapiClient() {
      try {
        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        authStatus.textContent = "Thư viện Google API đã sẵn sàng. Đang chờ Google Identity Services...";
        maybeEnableAuthButton();
      } catch (error) {
        console.error(error);
        authStatus.textContent = "Lỗi khởi tạo Google API: " + error.message;
        authStatus.classList.add("error");
      }
    }

    // Gọi khi gsi/client load xong
    function gisLoaded() {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: "", // sẽ gán sau
      });
      gisInited = true;
      maybeEnableAuthButton();
    }

    // Chỉ enable nút login khi cả 2 thư viện đã sẵn sàng
    function maybeEnableAuthButton() {
	  // Chỉ enable khi cả 2 thư viện đã sẵn sàng và đã mở khóa (unlocked === true)
	  if (gapiInited && gisInited && unlocked) {
		if (authorizeButton) { authorizeButton.disabled = false; authorizeButton.style.display = 'inline-flex'; }
		if (loginApiButton) { loginApiButton.disabled = false; loginApiButton.style.display = 'inline-flex'; }
		authStatus.textContent = 'Sẵn sàng. Chọn phương thức đăng nhập.';
	  } else if (gapiInited && gisInited && !unlocked) {
		authStatus.textContent = 'Thư viện đã sẵn sàng — nhập mật khẩu để mở tùy chọn đăng nhập.';
	  }
	}


    // Khi bấm Đăng nhập
    authorizeButton.onclick = () => {
      authorizeButton.disabled = true;
      authStatus.textContent = "Đang mở popup đăng nhập...";

      tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
          console.error(resp);
          authStatus.textContent = "Lỗi đăng nhập: " + (resp.error || "Unknown error");
          authStatus.classList.add("error");
          authorizeButton.disabled = false;
          return;
        }
        // Đăng nhập xong
        authStatus.textContent = "Đã đăng nhập và cấp quyền cho Google Drive.";
        authStatus.classList.remove("error");
        authStatus.classList.add("success");

        authorizeButton.textContent = "✅ Đã đăng nhập";
        signoutButton.disabled = false;
        uploadButton.disabled = false;
        listButton.disabled = false;
      };

      const token = gapi.client.getToken();
      if (!token) {
        // Chưa có token → yêu cầu login
        tokenClient.requestAccessToken({ prompt: "consent" });
      } else {
        // Đã có token → refresh
        tokenClient.requestAccessToken({ prompt: "" });
      }
    };

    // Đăng xuất
    signoutButton.onclick = () => {
      const token = gapi.client.getToken();
      if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken("");
      }

      authorizeButton.textContent = "🔐 Đăng nhập Google";
      authorizeButton.disabled = false;
      signoutButton.disabled = true;
      uploadButton.disabled = true;
      listButton.disabled = true;

      authStatus.textContent = "Đã đăng xuất. Cần đăng nhập lại để sử dụng.";
      authStatus.classList.remove("success");
    };

    // Upload file
    // Upload file với progress (XMLHttpRequest)
	uploadButton.onclick = async () => {
	  uploadStatus.classList.remove('error', 'success');
	  const token = gapi.client.getToken();
	  if (!token) {
		uploadStatus.textContent = "Bạn cần đăng nhập Google trước.";
		uploadStatus.classList.add("error");
		return;
	  }

	  const file = fileInput.files[0];
	  if (!file) {
		uploadStatus.textContent = "Vui lòng chọn 1 file để upload.";
		uploadStatus.classList.add("error");
		return;
	  }

	  uploadButton.disabled = true;
	  uploadStatus.textContent = "Đang upload lên Google Drive...";
	  const uploadProgressEl = document.getElementById('upload_progress');

	  try {
		const metadata = {
		  name: file.name,
		  mimeType: file.type || "application/octet-stream",
		};

		const form = new FormData();
		form.append(
		  "metadata",
		  new Blob([JSON.stringify(metadata)], { type: "application/json" })
		);
		form.append("file", file);

		const xhr = new XMLHttpRequest();
		xhr.open(
		  "POST",
		  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,iconLink,size,mimeType"
		);
		xhr.setRequestHeader("Authorization", "Bearer " + token.access_token);

		xhr.upload.onprogress = (evt) => {
		  if (evt.lengthComputable) {
			const loaded = evt.loaded;
			const total = evt.total || file.size;
			if (uploadProgressEl) {
			  uploadProgressEl.textContent = `${formatBytes(loaded)} / ${formatBytes(total)} (${Math.round((loaded/total)*100)}%)`;
			}
		  }
		};

		xhr.onload = async () => {
		  if (xhr.status >= 200 && xhr.status < 300) {
			const data = JSON.parse(xhr.responseText);
			uploadStatus.textContent = `Upload thành công: ${data.name}`;
			uploadStatus.classList.add("success");
			if (uploadProgressEl) uploadProgressEl.textContent = '';
			// reload danh sách file
			await listFiles();
		  } else {
			const err = xhr.responseText || xhr.statusText;
			uploadStatus.textContent = "Lỗi upload: " + err;
			uploadStatus.classList.add("error");
		  }
		  uploadButton.disabled = false;
		};

		xhr.onerror = () => {
		  uploadStatus.textContent = "Lỗi mạng khi upload.";
		  uploadStatus.classList.add("error");
		  uploadButton.disabled = false;
		};

		xhr.send(form);
	  } catch (error) {
		console.error(error);
		uploadStatus.textContent = "Lỗi upload: " + error.message;
		uploadStatus.classList.add("error");
		uploadButton.disabled = false;
	  }
	};


      const file = fileInput.files[0];
      if (!file) {
        uploadStatus.textContent = "Vui lòng chọn 1 file để upload.";
        uploadStatus.classList.add("error");
      }

      uploadButton.disabled = true;
      uploadStatus.textContent = "Đang upload lên Google Drive...";

      try {
        const metadata = {
          name: file.name,
          mimeType: file.type || "application/octet-stream",
        };

        const form = new FormData();
        form.append(
          "metadata",
          new Blob([JSON.stringify(metadata)], { type: "application/json" })
        );
        form.append("file", file);

        const res = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,iconLink,size,mimeType",
          {
            method: "POST",
            headers: new Headers({
              Authorization: "Bearer " + token.access_token,
            }),
            body: form,
          }
        );

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || "Upload failed");
        }

        const data = await res.json();
        uploadStatus.textContent = `Upload thành công: ${data.name}`;
        uploadStatus.classList.add("success");

        // Sau khi upload, reload danh sách file
        await listFiles();
      } catch (error) {
        console.error(error);
        uploadStatus.textContent = "Lỗi upload: " + error.message;
        uploadStatus.classList.add("error");
      } finally {
        uploadButton.disabled = false;
      }
    };

    // List files khi bấm nút
    listButton.onclick = () => {
      listFiles();
    };

    // Hàm liệt kê file
    async function listFiles() {
      listStatus.classList.remove("error", "success");
      const token = gapi.client.getToken();
      if (!token) {
        listStatus.textContent = "Bạn cần đăng nhập Google trước.";
        listStatus.classList.add("error");
        return;
      }

      listButton.disabled = true;
      listStatus.textContent = "Đang tải danh sách file...";

      try {
        const response = await gapi.client.drive.files.list({
          pageSize: 20,
          fields: "files(id,name,mimeType,modifiedTime,iconLink,webViewLink,size,parents)",
          orderBy: "modifiedTime desc",
        });

        const files = response.result.files || [];
        filesTbody.innerHTML = "";

        if (files.length === 0) {
          listStatus.textContent = "Không tìm thấy file nào (trong phạm vi quyền của app).";
          listStatus.classList.add("success");
          return;
        }

        for (const file of files) {
          const tr = document.createElement("tr");

          const nameTd = document.createElement("td");
          nameTd.textContent = file.name || "(Không tên)";

          const typeTd = document.createElement("td");
		  const tag = document.createElement("span");
		  tag.className = "tag";
		  if (file.mimeType === 'application/vnd.google-apps.folder') tag.textContent = 'Folder';
		  else tag.textContent = file.mimeType || 'Unknown';
		  typeTd.appendChild(tag);

          const modifiedTd = document.createElement("td");
          modifiedTd.textContent = file.modifiedTime
            ? new Date(file.modifiedTime).toLocaleString()
            : "";

          const sizeTd = document.createElement("td");
          sizeTd.textContent = file.size
            ? formatBytes(parseInt(file.size, 10))
            : "-";

          const linkTd = document.createElement("td");
          if (file.webViewLink) {
            const a = document.createElement("a");
            a.href = file.webViewLink;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.className = "link";
            a.textContent = "Mở";
            linkTd.appendChild(a);
          } else {
            linkTd.textContent = "-";
          }

          tr.appendChild(nameTd);
          tr.appendChild(typeTd);
          tr.appendChild(modifiedTd);
          tr.appendChild(sizeTd);
          tr.appendChild(linkTd);

          filesTbody.appendChild(tr);
        }

        listStatus.textContent = `Đã tải ${files.length} file.`;
        listStatus.classList.add("success");
      } catch (error) {
        console.error(error);
        listStatus.textContent = "Lỗi tải danh sách file: " + error.message;
        listStatus.classList.add("error");
      } finally {
        listButton.disabled = false;
      }
    }

    // Helper format size
    function formatBytes(bytes) {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    }