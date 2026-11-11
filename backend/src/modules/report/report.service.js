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