import ExcelJS from 'exceljs';
import { query } from '../../database/with-tx.js';

export async function getDashboard() {
  const { rows } = await query('SELECT * FROM v_dashboard_van_hanh');
  return rows[0];
}

export async function getRevenueByDay() {
  const { rows } = await query('SELECT * FROM v_doanh_thu_ngay');
  return rows;
}

export async function getBestSellingItems() {
  const { rows } = await query('SELECT * FROM v_mon_ban_chay WHERE so_luong_ban > 0 LIMIT 10');
  return rows;
}

export async function getKitchenPerformance() {
  const { rows } = await query('SELECT * FROM v_hieu_suat_bep');
  return rows;
}

export async function generateRevenueExcel() {
  // 1. Lấy dữ liệu
  const { rows } = await query('SELECT * FROM v_doanh_thu_ngay');
  
  // 2. Tạo workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Doanh Thu');

  // 3. Cấu hình cột
  worksheet.columns = [
    { header: 'Ngày', key: 'ngay', width: 15 },
    { header: 'Số Hóa Đơn', key: 'so_hoa_don', width: 15 },
    { header: 'Tổng Thu (VNĐ)', key: 'tong_thu', width: 20, style: { numFmt: '#,##0' } },
    { header: 'Tiền Mặt', key: 'thu_tien_mat', width: 15, style: { numFmt: '#,##0' } },
    { header: 'Chuyển Khoản', key: 'thu_chuyen_khoan', width: 15, style: { numFmt: '#,##0' } },
  ];

  // Style cho header
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0000FF' } };

  // 4. Đổ dữ liệu
  rows.forEach(row => {
    worksheet.addRow({
      ngay: row.ngay.toISOString().split('T')[0],
      so_hoa_don: row.so_hoa_don,
      tong_thu: Number(row.tong_thu),
      thu_tien_mat: Number(row.thu_tien_mat || 0),
      thu_chuyen_khoan: Number(row.thu_chuyen_khoan || 0)
    });
  });

  // 5. Trả về buffer
  return await workbook.xlsx.writeBuffer();
}