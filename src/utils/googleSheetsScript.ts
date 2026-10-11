/**
 * Google Apps Script Code template for Class 10A13 Google Sheet synchronization.
 * Can be deployed as a Web App (Anyone can access) to enable 2-way live sync.
 */

export const APPS_SCRIPT_CODE_TEMPLATE = `/**
 * GOOGLE APPS SCRIPT CHO SỔ QUỸ LỚP 10A13
 * Hướng dẫn 3 bước:
 * 1. Mở Google Sheet của lớp -> Tiện ích mở rộng (Extensions) -> Apps Script.
 * 2. Dán toàn bộ mã này vào và nhấn Lưu (Ctrl + S).
 * 3. Bấm "Triển khai" (Deploy) -> "Quản lý lượt triển khai mới" -> Chọn "Ứng dụng web" (Web app)
 *    - Thực thi dưới dạng: Tôi (Me)
 *    - Ai có quyền truy cập: Bất kỳ ai (Anyone)
 *    - Nhấn "Triển khai" và sao chép URL ứng dụng web dán vào Web App này!
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  initSheetsIfNeeded(ss);
  
  var txSheet = ss.getSheetByName("So_Thu_Chi");
  var stSheet = ss.getSheetByName("Danh_Sach_10A13");
  
  var txData = getSheetRowsAsJson(txSheet);
  var stData = getSheetRowsAsJson(stSheet);
  
  var result = {
    status: "success",
    lastUpdated: new Date().toISOString(),
    transactions: txData,
    students: stData
  };
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheetsIfNeeded(ss);
    
    var data = JSON.parse(e.postData.contents);
    
    if (data.action === "sync_all") {
      // Ghi đè hoặc đồng bộ toàn bộ
      updateTransactionsSheet(ss, data.transactions || []);
      updateStudentsSheet(ss, data.students || []);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Đồng bộ thành công " + (data.transactions ? data.transactions.length : 0) + " giao dịch sang Google Sheets!"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === "add_transaction") {
      var txSheet = ss.getSheetByName("So_Thu_Chi");
      var tx = data.transaction;
      txSheet.appendRow([
        tx.id || Utilities.getUuid(),
        tx.date || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd"),
        tx.time || "",
        tx.type === "income" ? "THU VÀO" : "CHI RA",
        tx.title || "",
        tx.category || "",
        tx.amount || 0,
        tx.recordedBy || "Thủ quỹ 10A13",
        tx.note || "",
        tx.receiptImage ? "Có hóa đơn" : "Không",
        new Date()
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Đã thêm giao dịch thành công vào Google Sheet!"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === "upload_image" || data.base64 || data.image) {
      return handleImageUploadToDrive(data);
    }

    if (data.action === "backup_data") {
      var backupContent = data.backupContent || "";
      if (!backupContent) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Nội dung sao lưu backupContent trống"
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var now = new Date();
      var dateStr = Utilities.formatDate(now, "GMT+7", "yyyyMMdd");
      var fileName = data.fileName || ("Backup_SoQuy_10A13_" + dateStr + ".json");
      var folderId = data.folderId ? String(data.folderId).trim() : "1d1YTxkOFluqzRzq9gBLMT1_yCBBdrld4";

      var folder;
      try {
        folder = DriveApp.getFolderById(folderId);
      } catch (err) {
        try {
          folder = DriveApp.getRootFolder();
        } catch (rootErr) {
          folder = DriveApp.createFolder("Backup_SoQuy_10A13");
        }
      }

      var backupFile = folder.createFile(fileName, backupContent, MimeType.PLAIN_TEXT);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Tự động sao lưu dữ liệu lên Google Drive thành công!",
        fileName: fileName,
        fileId: backupFile.getId(),
        fileUrl: backupFile.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Hành động không hợp lệ"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleImageUploadToDrive(data) {
  var base64Data = data.base64 || data.image || data.data;
  if (!base64Data) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Thiếu dữ liệu Base64 của ảnh"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var folderId = data.folderId ? String(data.folderId).trim() : "";
  var fileName = data.fileName ? String(data.fileName).trim() : ("receipt_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss") + ".jpg");

  var base64Clean = base64Data;
  var contentType = "image/jpeg";
  if (base64Clean.indexOf(",") !== -1) {
    var parts = base64Clean.split(",");
    var header = parts[0];
    base64Clean = parts[1];
    var match = header.match(/:(.*?);/);
    if (match && match[1]) {
      contentType = match[1];
    }
  }

  var decoded = Utilities.base64Decode(base64Clean);
  var blob = Utilities.newBlob(decoded, contentType, fileName);

  var folder;
  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (err) {
      folder = null;
    }
  }

  if (!folder) {
    var folderName = "HoaDon_SoQuy_10A13";
    var folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
  }

  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileId = file.getId();
  var directUrl = "https://lh3.googleusercontent.com/d/" + fileId;
  var downloadUrl = file.getDownloadUrl();

  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Tải ảnh lên Google Drive thành công",
    fileId: fileId,
    url: directUrl,
    downloadUrl: directUrl,
    googleDownloadUrl: downloadUrl,
    viewUrl: file.getUrl()
  })).setMimeType(ContentService.MimeType.JSON);
}

function initSheetsIfNeeded(ss) {
  var txSheet = ss.getSheetByName("So_Thu_Chi");
  if (!txSheet) {
    txSheet = ss.insertSheet("So_Thu_Chi");
    txSheet.appendRow(["Mã GD", "Ngày", "Giờ", "Loại", "Nội dung thu chi", "Danh mục", "Số tiền (VNĐ)", "Người ghi", "Ghi chú", "Hóa đơn", "Thời gian cập nhật"]);
    var headerRange = txSheet.getRange(1, 1, 1, 11);
    headerRange.setBackground("#10b981").setFontColor("#ffffff").setFontWeight("bold");
    txSheet.setFrozenRows(1);
  }
  
  var stSheet = ss.getSheetByName("Danh_Sach_10A13");
  if (!stSheet) {
    stSheet = ss.insertSheet("Danh_Sach_10A13");
    stSheet.appendRow(["STT", "Mã HS", "Họ và tên", "Giới tính", "Trạng thái nộp", "Số tiền đã nộp (VNĐ)", "Ngày nộp", "Hình thức", "Ghi chú"]);
    var stHeader = stSheet.getRange(1, 1, 1, 9);
    stHeader.setBackground("#3b82f6").setFontColor("#ffffff").setFontWeight("bold");
    stSheet.setFrozenRows(1);
  }
}

function updateTransactionsSheet(ss, transactions) {
  var sheet = ss.getSheetByName("So_Thu_Chi");
  if (!sheet) {
    sheet = ss.insertSheet("So_Thu_Chi");
  }
  sheet.clearContents();
  sheet.appendRow(["Mã GD", "Ngày", "Giờ", "Loại", "Nội dung thu chi", "Danh mục", "Số tiền (VNĐ)", "Người ghi", "Ghi chú", "Hóa đơn", "Thời gian cập nhật"]);
  
  var header = sheet.getRange(1, 1, 1, 11);
  header.setBackground("#10b981").setFontColor("#ffffff").setFontWeight("bold");
  sheet.setFrozenRows(1);
  
  if (transactions && transactions.length > 0) {
    var rows = transactions.map(function(t) {
      return [
        t.id || "",
        t.date || "",
        t.time || "",
        t.type === "income" ? "THU VÀO" : "CHI RA",
        t.title || "",
        t.category || "",
        Number(t.amount) || 0,
        t.recordedBy || "",
        t.note || "",
        (t.receiptImage || (t.receiptImages && t.receiptImages.length > 0)) ? "Có hóa đơn" : "Không",
        new Date()
      ];
    });
    sheet.getRange(2, 1, rows.length, 11).setValues(rows);
  }
}

function updateStudentsSheet(ss, students) {
  var sheet = ss.getSheetByName("Danh_Sach_10A13");
  if (!sheet) {
    sheet = ss.insertSheet("Danh_Sach_10A13");
  }
  sheet.clearContents();
  sheet.appendRow(["STT", "Mã HS", "Họ và tên", "Giới tính", "Trạng thái nộp", "Số tiền đã nộp (VNĐ)", "Ngày nộp", "Hình thức", "Ghi chú"]);
  
  var header = sheet.getRange(1, 1, 1, 9);
  header.setBackground("#3b82f6").setFontColor("#ffffff").setFontWeight("bold");
  sheet.setFrozenRows(1);
  
  if (students && students.length > 0) {
    var rows = students.map(function(s, idx) {
      return [
        s.stt !== undefined ? s.stt : (idx + 1),
        s.id || ("s-" + (idx + 1)),
        s.fullName || "",
        s.gender || "Nam",
        s.hasPaid ? "ĐÃ NỘP" : "CHƯA NỘP",
        Number(s.paidAmount) || 0,
        s.paidDate || "",
        s.paymentMethod === "transfer" ? "Chuyển khoản" : (s.paymentMethod === "cash" ? "Tiền mặt" : (s.hasPaid ? "Tiền mặt" : "")),
        s.note || ""
      ];
    });
    sheet.getRange(2, 1, rows.length, 9).setValues(rows);
  }
}

function getSheetRowsAsJson(sheet) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var rowObj = {};
    for (var j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = data[i][j];
    }
    rows.push(rowObj);
  }
  return rows;
}
`;

/**
 * GOOGLE APPS SCRIPT DÀNH RIÊNG CHO VIỆC UPLOAD ẢNH HÓA ĐƠN LÊN GOOGLE DRIVE
 * Nhận Base64 -> Lưu thành file ảnh trên Google Drive -> Set quyền public -> Trả về downloadUrl
 */
export const APPS_SCRIPT_IMAGE_UPLOAD_TEMPLATE = `/**
 * GOOGLE APPS SCRIPT WEB APP - TẢI ẢNH HÓA ĐƠN LÊN GOOGLE DRIVE
 * Dành cho: Sổ Quỹ Lớp 10A13
 * 
 * HƯỚNG DẪN CÀI ĐẶT 3 BƯỚC:
 * 1. Truy cập https://script.google.com/ và bấm "+ Dự án mới" (New project).
 * 2. Xóa toàn bộ mã mặc định và dán toàn bộ đoạn mã này vào (Ctrl + A -> Ctrl + V -> Lưu).
 * 3. Bấm "Triển khai" (Deploy) -> "Quản lý lượt triển khai mới" (New deployment):
 *    - Chọn loại: "Ứng dụng web" (Web app)
 *    - Mô tả: Upload Hóa Đơn Sổ Quỹ 10A13
 *    - Thực thi dưới dạng: "Tôi" (Me)
 *    - Ai có quyền truy cập: "Bất kỳ ai" (Anyone)  <--- RẤT QUAN TRỌNG!
 *    - Bấm "Triển khai" -> Chọn tài khoản Google của bạn -> Bấm "Nâng cao" (Advanced) -> Chọn "Đi tới dự án (không an toàn)".
 *    - Sao chép "URL ứng dụng web" (kết thúc bằng /exec) và dán vào ô "URL Google Apps Script Upload Ảnh" trên ứng dụng!
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJson({ status: "error", message: "Nội dung gửi lên rỗng" });
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return responseJson({ status: "error", message: "Dữ liệu JSON không hợp lệ: " + parseErr.toString() });
    }

    // 1. NHÁNH XỬ LÝ: TỰ ĐỘNG SAO LƯU DỮ LIỆU ĐỊNH KỲ (BACKUP DATA TO GOOGLE DRIVE)
    if (data.action === "backup_data") {
      var backupContent = data.backupContent || "";
      if (!backupContent) {
        return responseJson({ status: "error", message: "Nội dung sao lưu backupContent trống" });
      }

      var now = new Date();
      var dateStr = Utilities.formatDate(now, "GMT+7", "yyyyMMdd");
      var fileName = data.fileName || ("Backup_SoQuy_10A13_" + dateStr + ".json");
      var folderId = data.folderId ? String(data.folderId).trim() : "1d1YTxkOFluqzRzq9gBLMT1_yCBBdrld4";

      var folder;
      try {
        folder = DriveApp.getFolderById(folderId);
      } catch (err) {
        try {
          folder = DriveApp.getRootFolder();
        } catch (rootErr) {
          folder = DriveApp.createFolder("Backup_SoQuy_10A13");
        }
      }

      var backupFile = folder.createFile(fileName, backupContent, MimeType.PLAIN_TEXT);

      return responseJson({
        status: "success",
        message: "Tự động sao lưu dữ liệu lên Google Drive thành công!",
        fileName: fileName,
        fileId: backupFile.getId(),
        fileUrl: backupFile.getUrl()
      });
    }

    // 2. NHÁNH XỬ LÝ: UPLOAD ẢNH HÓA ĐƠN LÊN GOOGLE DRIVE
    var base64Data = data.base64 || data.image || data.data;
    if (!base64Data) {
      return responseJson({ status: "error", message: "Không tìm thấy chuỗi Base64 hình ảnh" });
    }

    var folderId = data.folderId ? String(data.folderId).trim() : "";
    var fileName = data.fileName ? String(data.fileName).trim() : ("receipt_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss") + ".jpg");

    // Tách phần header nếu chuỗi có định dạng data:image/jpeg;base64,...
    var base64Clean = base64Data;
    var contentType = "image/jpeg";
    if (base64Clean.indexOf(",") !== -1) {
      var parts = base64Clean.split(",");
      var meta = parts[0];
      base64Clean = parts[1];
      var match = meta.match(/:(.*?);/);
      if (match && match[1]) {
        contentType = match[1];
      }
    }

    // Chuyển Base64 thành Blob
    var decoded = Utilities.base64Decode(base64Clean);
    var blob = Utilities.newBlob(decoded, contentType, fileName);

    // Tìm hoặc mở thư mục trên Google Drive
    var folder;
    if (folderId) {
      try {
        folder = DriveApp.getFolderById(folderId);
      } catch (err) {
        folder = null;
      }
    }

    // Nếu không cấu hình folderId hoặc tìm không thấy, tự động tạo/dùng thư mục "HoaDon_SoQuy_10A13"
    if (!folder) {
      var folderName = "HoaDon_SoQuy_10A13";
      var folders = DriveApp.getFoldersByName(folderName);
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
      }
    }

    // Tạo file ảnh trong thư mục Google Drive
    var file = folder.createFile(blob);

    // Cấp quyền xem cho bất kỳ ai có link (Public direct link)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    // URL direct ảnh Google Content (Tải và hiển thị siêu tốc trên Web)
    var directUrl = "https://lh3.googleusercontent.com/d/" + fileId;
    var downloadUrl = file.getDownloadUrl();

    return responseJson({
      status: "success",
      message: "Tải ảnh hóa đơn lên Google Drive thành công!",
      fileId: fileId,
      url: directUrl,
      downloadUrl: directUrl,
      googleDownloadUrl: downloadUrl,
      viewUrl: file.getUrl()
    });

  } catch (error) {
    return responseJson({
      status: "error",
      message: error.toString()
    });
  }
}

function doGet(e) {
  return responseJson({
    status: "success",
    message: "Google Apps Script Upload Ảnh Hóa Đơn Sổ Quỹ Lớp 10A13 hoạt động bình thường!",
    time: new Date().toISOString()
  });
}

function responseJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Helper tải chuỗi Base64 ảnh lên Google Drive thông qua Apps Script Web App
 */
export async function uploadImageToGoogleDriveViaAppsScript(
  base64DataUrl: string,
  appsScriptUrl: string,
  folderId?: string,
  fileName?: string
): Promise<string> {
  const url = appsScriptUrl.trim();
  if (!url) {
    throw new Error('Chưa cấu hình URL Google Apps Script Upload Ảnh');
  }

  const payload = {
    action: 'upload_image',
    base64: base64DataUrl,
    folderId: folderId ? folderId.trim() : '',
    fileName: fileName || `receipt_${Date.now()}.jpg`,
  };

  // Lưu ý: Dùng Content-Type text/plain;charset=utf-8 để tránh trình duyệt gửi request OPTIONS (CORS preflight) tới Google Apps Script
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Máy chủ Google Apps Script trả về lỗi HTTP ${response.status}`);
  }

  const result = await response.json();
  if (result.status === 'success' && (result.downloadUrl || result.url)) {
    return result.downloadUrl || result.url;
  }

  if (result.status === 'error') {
    throw new Error(result.message || 'Lỗi khi lưu ảnh lên Google Drive');
  }

  throw new Error('Không nhận được đường dẫn ảnh hợp lệ từ Google Drive');
}

/**
 * Helper gửi tệp sao lưu dữ liệu toàn bộ sổ quỹ lên Google Drive qua Apps Script Web App
 */
export async function backupDataToGoogleDriveViaAppsScript(
  backupContent: string,
  appsScriptUrl: string,
  folderId?: string,
  fileName?: string
): Promise<{ status: string; fileName: string }> {
  const url = appsScriptUrl.trim();
  if (!url) {
    throw new Error('Chưa cấu hình URL Google Apps Script');
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const actualFileName = fileName || `Backup_SoQuy_10A13_${dateStr}.json`;

  const payload = {
    action: 'backup_data',
    backupContent,
    folderId: folderId ? folderId.trim() : '1d1YTxkOFluqzRzq9gBLMT1_yCBBdrld4',
    fileName: actualFileName,
  };

  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  return {
    status: 'success',
    fileName: actualFileName,
  };
}

