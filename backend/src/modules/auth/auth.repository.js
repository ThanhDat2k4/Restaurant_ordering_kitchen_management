import { query } from '../../database/with-tx.js';

export async function findUserByIdentifier(identifier) {
  const { rows } = await query(
    `SELECT t.ma_tai_khoan, t.ten_dang_nhap, t.ho_ten, t.mat_khau_ma_hoa,
            t.trang_thai_tai_khoan, t.so_lan_dang_nhap_sai, t.khoa_den,
            v.ten_vai_tro
       FROM tai_khoan t
       JOIN vai_tro v ON v.ma_vai_tro = t.ma_vai_tro
      WHERE t.ten_dang_nhap = $1
         OR lower(t.email) = lower($1)
         OR t.so_dien_thoai = $1
      LIMIT 1`,
    [identifier]
  );
  return rows[0] || null;
}

export async function findUserById(userId) {
  const { rows } = await query(
    `SELECT t.ma_tai_khoan, t.ten_dang_nhap, t.ho_ten, t.email, t.so_dien_thoai,
            t.trang_thai_tai_khoan, v.ten_vai_tro
       FROM tai_khoan t
       JOIN vai_tro v ON v.ma_vai_tro = t.ma_vai_tro
      WHERE t.ma_tai_khoan = $1`,
    [userId]
  );
  return rows[0] || null;
}

export async function getStations(userId) {
  const { rows } = await query(
    `SELECT tk.ma_tram, tcb.ten_tram
       FROM tai_khoan_tram tk
       JOIN tram_che_bien tcb ON tcb.ma_tram = tk.ma_tram
      WHERE tk.ma_tai_khoan = $1`,
    [userId]
  );
  return rows;
}

export async function getRoleIdByName(roleName, client) {
  const { rows } = await client.query(
    'SELECT ma_vai_tro FROM vai_tro WHERE ten_vai_tro = $1',
    [roleName]
  );
  return rows[0] ? rows[0].ma_vai_tro : null;
}

export async function insertEmployee(data, passwordHash, maVaiTro, client) {
  const { rows } = await client.query(
    `INSERT INTO tai_khoan (ma_vai_tro, ho_ten, ten_dang_nhap, mat_khau_ma_hoa, email, so_dien_thoai, trang_thai_tai_khoan)
     VALUES ($1, $2, $3, $4, $5, $6, 'HOAT_DONG') 
     RETURNING ma_tai_khoan, ten_dang_nhap, ho_ten, email, so_dien_thoai`,
    [maVaiTro, data.ho_ten, data.ten_dang_nhap, passwordHash, data.email || null, data.so_dien_thoai || null]
  );
  return rows[0];
}

export async function assignStations(userId, stations, client) {
  if (!stations || stations.length === 0) return;
  const values = stations.map(maTram => `(${userId}, ${maTram})`).join(',');
  await client.query(`INSERT INTO tai_khoan_tram (ma_tai_khoan, ma_tram) VALUES ${values}`);
}

export async function getEmployeesList({ role, search, page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;
  let conditions = ["vt.ten_vai_tro != 'KHACH'"]; // Không lấy tài khoản Khách hàng
  let params = [];
  let paramCount = 1;

  // Nếu có lọc theo vai trò
  if (role) {
    conditions.push(`vt.ten_vai_tro = $${paramCount}`);
    params.push(role);
    paramCount++;
  }
  
  // Nếu có tìm kiếm theo tên, tên đăng nhập hoặc sđt
  if (search) {
    conditions.push(`(tk.ho_ten ILIKE $${paramCount} OR tk.ten_dang_nhap ILIKE $${paramCount} OR tk.so_dien_thoai ILIKE $${paramCount})`);
    params.push(`%${search}%`);
    paramCount++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Đếm tổng số để phân trang
  const countSql = `
    SELECT count(*) FROM tai_khoan tk 
    JOIN vai_tro vt ON tk.ma_vai_tro = vt.ma_vai_tro 
    ${whereClause}
  `;
  const countRes = await query(countSql, params);
  const total = parseInt(countRes.rows[0].count);

  // Lấy dữ liệu (Bỏ qua cột mật khẩu)
  const dataSql = `
    SELECT tk.ma_tai_khoan, tk.ho_ten, tk.ten_dang_nhap, tk.email, tk.so_dien_thoai, 
           tk.trang_thai_tai_khoan, tk.ngay_tao, vt.ten_vai_tro
    FROM tai_khoan tk
    JOIN vai_tro vt ON tk.ma_vai_tro = vt.ma_vai_tro
    ${whereClause}
    ORDER BY tk.ma_tai_khoan DESC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `;
  params.push(limit, offset);
  
  const dataRes = await query(dataSql, params);

  return {
    data: dataRes.rows,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(total / limit)
    }
  };
}