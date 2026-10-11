# HƯỚNG DẪN KẾT NỐI CLOUD FIRESTORE, FIREBASE STORAGE & GOOGLE AUTH - SỔ QUỸ LỚP 10A13
> Dành cho triển khai GitHub (`webnpmvung/thuquy10a13`) & Vercel (`thuquy10a13.vercel.app`)

Tài liệu này hướng dẫn chi tiết từng bước từ A đến Z để bạn cấu hình lưu trữ trực tuyến hoàn toàn 100% trên Google Cloud Firestore và Firebase Storage:
- **Tuyệt đối không dùng bộ nhớ cục bộ (localStorage, sessionStorage, indexedDB):** Mọi giao dịch, danh sách học sinh và nhật ký đều lưu trực tiếp trên Firestore đám mây.
- **Firebase Storage:** Tự động tải file ảnh hóa đơn lên Google Storage bucket và chỉ lưu đường link (URL) tải về vào Firestore database.
- **Bảo mật phân quyền Google Auth:** Chỉ tài khoản Admin đăng nhập bằng Google mới có quyền cấu hình hệ thống và cấp quyền cho thủ quỹ.

---

## MỤC LỤC
1. [Kiến trúc lưu trữ trực tuyến 100% (Zero Local Storage)](#1-kien-truc-luu-tru-truc-tuyen-100)
2. [Bước 1: Tạo dự án Firebase mới](#buoc-1-tao-du-an-firebase-moi)
3. [Bước 2: Bật cơ sở dữ liệu Cloud Firestore Database](#buoc-2-bat-co-so-du-lieu-cloud-firestore)
4. [Bước 3: Cấu hình Cloud Firestore Rules](#buoc-3-cau-hinh-firestore-rules)
5. [Bước 4: Bật Firebase Storage để lưu ảnh hóa đơn](#buoc-4-bat-firebase-storage)
6. [Bước 5: Cấu hình Firebase Storage Rules](#buoc-5-cau-hinh-firebase-storage-rules)
7. [Bước 6: Bật xác thực Google Sign-In](#buoc-6-bat-xac-thuc-google-sign-in)
8. [Bước 7: Thêm domain Vercel vào Authorized Domains](#buoc-7-them-domain-vercel-vao-authorized-domains)
9. [Bước 8: Lấy thông tin cấu hình Web App (Firebase Config)](#buoc-8-lay-thong-tin-cau-hinh-web-app)
10. [Bước 9: Thêm biến môi trường trên Vercel.com](#buoc-9-them-bien-moi-truong-tren-vercel)

---

## 1. KIẾN TRÚC LƯU TRỮ TRỰC TUYẾN 100%
- **Không phụ thuộc thiết bị:** Bất kỳ ai mở trang web trên điện thoại, máy tính bàn hay laptop đều đọc dữ liệu trực tiếp từ Firestore qua kết nối thời gian thực (`onSnapshot`).
- **Từng bản ghi độc lập:** Mỗi giao dịch là một document `transactions/{id}` riêng biệt. Không bao giờ xảy ra tình trạng ghi đè toàn bộ danh sách khi có người khác nhập liệu cùng lúc.
- **Tự động tải ảnh lên Firebase Storage:** Khi người dùng chụp hóa đơn từ camera điện thoại hoặc chọn ảnh từ thư viện, ảnh được nén tối ưu và tải trực tiếp lên Google Cloud Storage (`receipts/...`). Sau đó chỉ đường link công khai (`https://firebasestorage.googleapis.com/...`) được lưu vào Firestore document, giúp cơ sở dữ liệu nhẹ, tốc độ tải siêu nhanh.

---

## BƯỚC 1: TẠO DỰ ÁN FIREBASE MỚI
1. Truy cập vào trang quản trị Firebase của Google: [https://console.firebase.google.com](https://console.firebase.google.com)
2. Đăng nhập bằng tài khoản Google của bạn.
3. Nhấn vào nút **"Add project"** (Thêm dự án).
4. Nhập tên dự án: ví dụ `thuquy-10a13`.
5. Nhấn **Continue**, tắt Google Analytics (nếu muốn tối giản), sau đó nhấn **Create project**.
6. Chờ Google khởi tạo xong và nhấn **Continue**.

---

## BƯỚC 2: BẬT CƠ SỞ DỮ LIỆU CLOUD FIRESTORE
1. Ở thanh menu bên trái, tìm mục **Build** > chọn **Firestore Database**.
2. Nhấn vào nút **Create database**.
3. Chọn vị trí máy chủ (Location): Khuyên dùng `asia-southeast1` (Singapore) hoặc `asia-east1`.
4. Chọn chế độ ban đầu: **Start in test mode**.
5. Nhấn **Create**.

---

## BƯỚC 3: CẤU HÌNH FIRESTORE RULES
1. Trong màn hình Firestore Database, nhấn vào tab **Rules** ở thanh trên cùng.
2. Dán đoạn mã sau vào:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Nhấn nút **Publish** ở góc phải để lưu quy tắc.

---

## BƯỚC 4: BẬT FIREBASE STORAGE
1. Ở thanh menu bên trái, tìm mục **Build** > chọn **Storage**.
2. Nhấn vào nút **Get started**.
3. Chọn vị trí (Location) tương tự như Firestore (`asia-southeast1`).
4. Nhấn **Done**.

---

## BƯỚC 5: CẤU HÌNH FIREBASE STORAGE RULES
*(Rất quan trọng để ứng dụng có quyền tải ảnh hóa đơn lên đám mây)*
1. Trong màn hình **Storage**, nhấn vào tab **Rules**.
2. Dán đoạn mã sau vào:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

3. Nhấn nút **Publish** để lưu quy tắc.

---

## BƯỚC 6: BẬT XÁC THỰC GOOGLE SIGN-IN
1. Ở menu bên trái, tìm mục **Build** > chọn **Authentication**.
2. Nhấn vào nút **Get started**.
3. Trong tab **Sign-in method**, tìm mục **Google** và nhấn vào.
4. Gạt công tắc **Enable** sang màu xanh.
5. Nhập **Project public-facing name**: ví dụ `Sổ Quỹ 10A13`.
6. Chọn **Project support email**: chọn email Google của bạn.
7. Nhấn **Save**.

---

## BƯỚC 7: THÊM DOMAIN VERCEL VÀO AUTHORIZED DOMAINS
*(Nếu không làm bước này, đăng nhập Google trên Vercel sẽ báo lỗi `auth/unauthorized-domain`)*
1. Trong trang **Authentication**, nhấn sang tab **Settings**.
2. Chọn mục **Authorized domains** ở danh sách bên dưới.
3. Nhấn nút **Add domain**.
4. Nhập tên miền ứng dụng Vercel của bạn (ví dụ: `thuquy10a13.vercel.app`).
5. Nhấn **Add**.

---

## BƯỚC 8: LẤY THÔNG TIN CẤU HÌNH WEB APP (FIREBASE CONFIG)
1. Nhấn vào biểu tượng **Bánh răng cưa (Project settings)** ở góc trên cùng bên trái.
2. Cuộn chuột xuống dưới cùng mục **Your apps**.
3. Nhấn vào biểu tượng Web: `</>`.
4. Nhập tên App Nickname: `Web Sổ Quỹ 10A13`.
5. Bỏ qua ô *Firebase Hosting*, nhấn **Register app**.
6. Firebase sẽ hiển thị đoạn mã cấu hình dạng:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "thuquy-10a13.firebaseapp.com",
  projectId: "thuquy-10a13",
  storageBucket: "thuquy-10a13.firebasestorage.app",
  messagingSenderId: "123456789...",
  appId: "1:123456789:web:abcdef..."
};
```

---

## BƯỚC 9: THÊM BIẾN MÔI TRƯỜNG TRÊN VERCEL
1. Mở trang quản trị [https://vercel.com/dashboard](https://vercel.com/dashboard).
2. Chọn dự án `thuquy10a13`.
3. Nhấn vào tab **Settings** > chọn mục **Environment Variables**.
4. Thêm các biến sau:

| Tên biến (Key) | Giá trị (Value) |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` từ bước 8 |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` từ bước 8 |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` từ bước 8 |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` từ bước 8 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` từ bước 8 |
| `VITE_FIREBASE_APP_ID` | `appId` từ bước 8 |
| `VITE_FIREBASE_DATABASE_ID` | `(default)` |

5. Sau khi thêm xong, sang tab **Deployments** trên Vercel, chọn lượt deploy gần nhất > nhấn dấu 3 chấm > chọn **Redeploy**.
Ứng dụng sẽ chạy 100% online trên Firestore và Firebase Storage!
