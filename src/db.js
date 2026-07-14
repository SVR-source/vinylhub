import { supabase } from "./supabaseClient";

// ===== ĐỌC: DB (chữ gạch dưới) -> App (chữ camelCase) =====
const fromBranch   = r => ({ id:r.id, name:r.name, address:r.address, central:r.central });
const fromEmp      = r => ({ id:r.id, name:r.name, phone:r.phone, email:r.email, password:r.password, role:r.role, branchId:r.branch_id });
const fromProduct  = r => ({ id:r.id, name:r.name, artist:r.artist, brand:r.brand, barcode:r.barcode, group:r.group, desc:r.descr, img:r.img, cost:Number(r.cost), price:Number(r.price), branchId:r.branch_id, createdAt:r.created_at, updatedAt:r.updated_at });
const fromCustomer = r => ({ id:r.id, name:r.name, phone:r.phone, email:r.email, address:r.address, debt:Number(r.debt), group:r.grp, branchId:r.branch_id });
const fromSupplier = r => ({ id:r.id, name:r.name, phone:r.phone, email:r.email, address:r.address, debt:Number(r.debt) });
const fromInbound  = r => ({ id:r.id, date:r.date, supplier:r.supplier, branchId:r.branch_id, discount:Number(r.discount), paid:Number(r.paid), lines:r.lines||[] });
const fromSale     = r => ({ id:r.id, date:r.date, customer:r.customer, branchId:r.branch_id, discount:Number(r.discount), total:Number(r.total), paid:Number(r.paid), lines:r.lines||[] });

// ===== GHI: App -> DB =====
const toBranch   = b => ({ id:b.id, name:b.name, address:b.address, central:!!b.central });
const toEmp      = e => ({ id:e.id, name:e.name, phone:e.phone, email:e.email, password:e.password, role:e.role, branch_id:e.branchId });
const toProduct  = p => ({ id:p.id, name:p.name, artist:p.artist||"", brand:p.brand||"", barcode:p.barcode||"", group:p.group||"", descr:p.desc||"", img:p.img||"", cost:Number(p.cost)||0, price:Number(p.price)||0, branch_id:p.branchId, created_at:p.createdAt, updated_at:p.updatedAt });
const toCustomer = c => ({ id:c.id, name:c.name, phone:c.phone||"", email:c.email||"", address:c.address||"", debt:Number(c.debt)||0, grp:c.group||"", branch_id:c.branchId });
const toSupplier = s => ({ id:s.id, name:s.name, phone:s.phone||"", email:s.email||"", address:s.address||"", debt:Number(s.debt)||0 });
const toInbound  = i => ({ id:i.id, date:i.date, supplier:i.supplier, branch_id:i.branchId, discount:Number(i.discount)||0, paid:Number(i.paid)||0, lines:i.lines||[] });
const toSale     = s => ({ id:s.id, date:s.date, customer:s.customer, branch_id:s.branchId, discount:Number(s.discount)||0, total:Number(s.total)||0, paid:Number(s.paid)||0, lines:s.lines||[] });

// ===== TẢI HẾT DỮ LIỆU KHI MỞ APP =====
export async function loadAll() {
  const [b,e,p,c,s,ib,sl,st,h] = await Promise.all([
    supabase.from("branches").select("*"),
    supabase.from("employees").select("*"),
    supabase.from("products").select("*"),
    supabase.from("customers").select("*"),
    supabase.from("suppliers").select("*"),
    supabase.from("inbounds").select("*"),
    supabase.from("sales").select("*"),
    supabase.from("stock").select("*"),
    supabase.from("stock_history").select("*").order("id", { ascending:false }),
  ]);
  for (const r of [b,e,p,c,s,ib,sl,st,h]) if (r.error) throw r.error;
  const stock = {};
  (st.data||[]).forEach(r => { stock[r.key] = Number(r.qty); });
  return {
    branches:(b.data||[]).map(fromBranch),
    employees:(e.data||[]).map(fromEmp),
    products:(p.data||[]).map(fromProduct),
    customers:(c.data||[]).map(fromCustomer),
    suppliers:(s.data||[]).map(fromSupplier),
    inbounds:(ib.data||[]).map(fromInbound),
    sales:(sl.data||[]).map(fromSale),
    stock,
    stockHistory:(h.data||[]).map(r=>({ time:r.time, doc:r.doc, sku:r.sku, branch:r.branch, type:r.type, qty:Number(r.qty), price:Number(r.price) })),
  };
}

// ===== LƯU: đồng bộ cả bảng (thêm/sửa + xóa dòng đã bỏ) =====
async function sync(table, rows, ids) {
  if (rows.length) { const { error } = await supabase.from(table).upsert(rows); if (error) console.error("Lưu "+table, error); }
  const { data } = await supabase.from(table).select("id");
  const del = (data||[]).map(x=>x.id).filter(id => !ids.includes(id));
  if (del.length) await supabase.from(table).delete().in("id", del);
}

export const saveBranches  = a => sync("branches",  a.map(toBranch),   a.map(x=>x.id));
export const saveEmployees = a => sync("employees", a.map(toEmp),      a.map(x=>x.id));
export const saveProducts  = a => sync("products",  a.map(toProduct),  a.map(x=>x.id));
export const saveCustomers = a => sync("customers", a.map(toCustomer), a.map(x=>x.id));
export const saveSuppliers = a => sync("suppliers", a.map(toSupplier), a.map(x=>x.id));
export const saveInbounds  = a => sync("inbounds",  a.map(toInbound),  a.map(x=>x.id));
export const saveSales     = a => sync("sales",     a.map(toSale),     a.map(x=>x.id));

export async function saveStock(obj) {
  const rows = Object.entries(obj).map(([key,qty]) => ({ key, qty:Number(qty)||0 }));
  if (rows.length) await supabase.from("stock").upsert(rows);
}
export async function saveHistory(rows) {
  await supabase.from("stock_history").delete().gt("id", 0);
  if (rows.length) await supabase.from("stock_history").insert(
    rows.map(r=>({ time:r.time, doc:r.doc, sku:r.sku, branch:r.branch, type:r.type, qty:r.qty, price:r.price }))
  );
}