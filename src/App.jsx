import React, { useState, useEffect, useContext, createContext } from "react";
import { loadAll, saveBranches, saveEmployees, saveProducts, saveCustomers, saveSuppliers, saveInbounds, saveSales, saveStock, saveHistory } from "./db";
import {
  LayoutDashboard, ShoppingCart, Disc3, Users, Truck, Package, Wallet,
  UserCog, BarChart3, Plus, Search, Menu, X, ChevronDown, UploadCloud,
  FileSpreadsheet, Download, AlertTriangle, Trash2, Bell, Shield, TrendingUp,
  ArrowRightLeft, CheckCircle2, DollarSign, Building2, Eye, Pencil, Lock, LogOut, Phone,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

/* ============ HELPERS ============ */
const resizeImage = (file, max = 600) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > h && w > max) { h = h * max / w; w = max; }
      else if (h > max) { w = w * max / h; h = max; }
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", 0.8)); // nén 80%, tối đa 600px
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});
const fmt = (n) => (Number(n) || 0).toLocaleString("vi-VN") + "₫";
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toLocaleString("vi-VN");
const rnd = (p) => p + Math.floor(10000 + Math.random() * 89999);
/* ============ LOCALSTORAGE HOOK ============ */
// Giống useState bình thường, nhưng tự lưu vào bộ nhớ trình duyệt
const usePersist = (key, initial) => {
  const [val, setVal] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : initial;
    } catch { return initial; }
  });
  React.useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal];
};

/* ============ SEED DATA ============ */
const seedBranches = [
  { id: "CN01", name: "Kho Trung Tâm HCM", address: "12 Lê Lợi, Q1, TP.HCM", central: true },
  { id: "CN02", name: "Chi Nhánh Hà Nội", address: "45 Bà Triệu, Hoàn Kiếm, HN", central: false },
  { id: "CN03", name: "Chi Nhánh Đà Nẵng", address: "88 Nguyễn Văn Linh, ĐN", central: false },
];
const GROUPS = ["Rock", "Pop", "Jazz", "Classical", "Hip-Hop", "Soul/Funk"];
const IMG = (t) => `https://placehold.co/300x300/2563eb/fff?text=${encodeURIComponent(t)}`;
const seedProducts = [
  { id: "SKU001", name: "1989 (Taylor's Version)", artist: "Taylor Swift", brand: "Republic", barcode: "8935001", group: "Pop", desc: "Album phòng thu tái bản.", img: IMG("1989"), cost: 620000, price: 990000, branchId: "CN01", createdAt: "2026-01-10", updatedAt: "2026-05-01" },
  { id: "SKU002", name: "The Dark Side of the Moon", artist: "Pink Floyd", brand: "Harvest", barcode: "8935002", group: "Rock", desc: "Kiệt tác progressive rock 1973.", img: IMG("Floyd"), cost: 700000, price: 1150000, branchId: "CN01", createdAt: "2026-01-12", updatedAt: "2026-04-20" },
  { id: "SKU003", name: "Abbey Road", artist: "The Beatles", brand: "Apple", barcode: "8935003", group: "Rock", desc: "Album 1969.", img: IMG("Abbey"), cost: 680000, price: 1090000, branchId: "CN02", createdAt: "2026-02-01", updatedAt: "2026-05-03" },
  { id: "SKU004", name: "Thriller", artist: "Michael Jackson", brand: "Epic", barcode: "8935004", group: "Pop", desc: "Album bán chạy nhất mọi thời.", img: IMG("Thriller"), cost: 650000, price: 1050000, branchId: "CN02", createdAt: "2026-02-05", updatedAt: "2026-05-05" },
  { id: "SKU005", name: "Kind of Blue", artist: "Miles Davis", brand: "Columbia", barcode: "8935005", group: "Jazz", desc: "Jazz kinh điển 1959.", img: IMG("Blue"), cost: 590000, price: 950000, branchId: "CN03", createdAt: "2026-02-10", updatedAt: "2026-04-28" },
  { id: "SKU006", name: "Rumours", artist: "Fleetwood Mac", brand: "Warner", barcode: "8935006", group: "Rock", desc: "Album 1977.", img: IMG("Rumours"), cost: 640000, price: 1020000, branchId: "CN01", createdAt: "2026-03-01", updatedAt: "2026-05-02" },
];
const seedCustomers = [
  { id: "KH01", name: "Nguyễn Thu Hà", phone: "0901234567", email: "ha@gmail.com", address: "Q3, HCM", debt: 0, group: "VIP", branchId: "CN01" },
  { id: "KH02", name: "Trần Minh Đức", phone: "0912345678", email: "duc@gmail.com", address: "Cầu Giấy, HN", debt: 500000, group: "Thân thiết", branchId: "CN02" },
  { id: "KH03", name: "Lê Quốc Bảo", phone: "0923456789", email: "bao@gmail.com", address: "Hải Châu, ĐN", debt: 0, group: "Mới", branchId: "CN03" },
];
const seedSuppliers = [
  { id: "NCC01", name: "Vinyl World Distribution", phone: "02838001122", email: "sales@vinylworld.com", address: "Singapore", debt: 3000000 },
  { id: "NCC02", name: "Sound Records Import", phone: "02439004455", email: "info@soundrecords.vn", address: "Hà Nội", debt: 0 },
];
const seedInbounds = [
  { id: "PN00125", date: "2026-05-10", supplier: "NCC01", branchId: "CN01", discount: 0, paid: 20000000, lines: [{ sku: "SKU001", qty: 10, price: 620000 }] },
];
const seedSales = [
  { id: "DB00312", date: "2026-05-15", customer: "KH01", branchId: "CN01", discount: 0, total: 1980000, paid: 1980000, lines: [{ sku: "SKU001", qty: 2, price: 990000 }] },
  { id: "DB00311", date: "2026-05-14", customer: "KH02", branchId: "CN02", discount: 0, total: 1090000, paid: 0, lines: [{ sku: "SKU003", qty: 1, price: 1090000 }] },
];
const seedStock = { "SKU001-CN01": 24, "SKU002-CN01": 16, "SKU006-CN01": 15, "SKU003-CN02": 12, "SKU004-CN02": 4, "SKU005-CN03": 8 };
const seedEmployees = [
  { id: "NV01", name: "Nguyễn Văn Minh", phone: "0900000001", email: "minh@vinylhub.vn", password: "123456", role: "Admin", branchId: "CN01" },
  { id: "NV02", name: "Trần Thị Hoa", phone: "0900000002", email: "hoa@vinylhub.vn", password: "123456", role: "Sales", branchId: "CN02" },
  { id: "NV03", name: "Lê Hoàng Nam", phone: "0900000003", email: "nam@vinylhub.vn", password: "123456", role: "Sales", branchId: "CN03" },
];
const seedHistory = [
  { time: "2026-05-10 09:00", doc: "PN00125", sku: "SKU001", branch: "CN01", type: "Nhập kho", qty: 10, price: 620000 },
  { time: "2026-05-15 14:30", doc: "DB00312", sku: "SKU001", branch: "CN01", type: "Xuất bán", qty: -2, price: 990000 },
];

/* ============ CONTEXT ============ */
const Ctx = createContext(null);
const useStore = () => useContext(Ctx);

/* ============ HOOK MULTI-SELECT ============ */
const useSel = (items) => {
  const [sel, setSel] = useState([]);
  const ids = items.map((i) => i.id);
  const toggle = (id) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleAll = () => setSel(sel.length === ids.length ? [] : ids);
  return { sel, setSel, toggle, toggleAll, allChecked: ids.length > 0 && sel.length === ids.length };
};

/* ============ UI ============ */
const Card = ({ children, className = "" }) => <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${className}`}>{children}</div>;
const Badge = ({ children, cls = "bg-slate-100 text-slate-600 ring-slate-200" }) => <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${cls}`}>{children}</span>;
const Btn = ({ children, variant = "primary", className = "", ...p }) => {
  const v = { primary: "bg-blue-600 text-white hover:bg-blue-700", ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200", outline: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50", danger: "bg-rose-600 text-white hover:bg-rose-700" }[variant];
  return <button className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${v} ${className}`} {...p}>{children}</button>;
};
const Input = ({ label, ...p }) => <label className="block">{label && <span className="block text-sm font-medium text-slate-600 mb-1.5">{label}</span>}<input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" {...p} /></label>;
const Select = ({ label, children, ...p }) => <label className="block">{label && <span className="block text-sm font-medium text-slate-600 mb-1.5">{label}</span>}<select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" {...p}>{children}</select></label>;
const Modal = ({ open, onClose, title, children, size = "md" }) => {
  if (!open) return null;
  const w = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 animate-[fadeIn_.2s]" onClick={onClose}><div className={`bg-white rounded-2xl shadow-xl w-full ${w} max-h-[92vh] overflow-y-auto animate-[popIn_.2s]`} onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white"><h3 className="font-bold text-slate-800">{title}</h3><button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={18} /></button></div><div className="p-5">{children}</div></div></div>;
};
const PageHead = ({ title, desc, action }) => <div className="flex items-start justify-between mb-5 gap-3 flex-wrap"><div><h1 className="text-xl sm:text-2xl font-bold text-slate-800">{title}</h1>{desc && <p className="text-slate-500 text-sm mt-1">{desc}</p>}</div>{action}</div>;
const Table = ({ head, children }) => <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-slate-50 border-b border-slate-200">{head.map((h, i) => <th key={i} className="text-left px-3 py-3 font-semibold text-slate-500 whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div></Card>;
const Row = ({ children }) => <tr className="border-b border-slate-100 hover:bg-slate-50/70">{children}</tr>;
const Td = ({ children, className = "" }) => <td className={`px-3 py-3 whitespace-nowrap ${className}`}>{children}</td>;
const Check = ({ checked, onChange }) => <input type="checkbox" checked={checked} onChange={onChange} onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />;
const StatCard = ({ icon: Ic, label, value, sub, color = "blue" }) => {
  const c = { blue: "bg-blue-50 text-blue-600", cyan: "bg-cyan-50 text-cyan-600", emerald: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600" }[color];
  return <Card className="p-5"><div className="flex items-center justify-between"><div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c}`}><Ic size={22} /></div>{sub && <span className="text-xs font-semibold text-emerald-600">{sub}</span>}</div><p className="text-slate-500 text-sm mt-3">{label}</p><p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p></Card>;
};
const Toast = ({ msg }) => msg ? <div className="fixed bottom-6 right-6 z-[60] bg-slate-800 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-[popIn_.2s]"><CheckCircle2 size={18} className="text-emerald-400" /> {msg}</div> : null;
const BulkBar = ({ count, onDelete, onClear }) => count > 0 ? <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl animate-[fadeIn_.2s]"><span className="text-sm font-semibold text-blue-700">Đã chọn {count} mục</span><Btn variant="danger" onClick={onDelete} className="!py-1.5 !px-3"><Trash2 size={15} /> Xóa</Btn><button onClick={onClear} className="text-sm text-slate-500 hover:underline ml-auto">Bỏ chọn</button></div> : null;

/* ============ NAV ============ */
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { label: "Đơn hàng", icon: ShoppingCart, children: [{ key: "sales", label: "Danh sách đơn hàng" }, { key: "sale-new", label: "Tạo đơn hàng mới" }] },
  { label: "Sản phẩm", icon: Disc3, children: [{ key: "products", label: "Danh sách sản phẩm" }, { key: "product-new", label: "Tạo sản phẩm mới" }, { label: "Nhập hàng", children: [{ key: "inbound-list", label: "Danh sách phiếu nhập" }, { key: "inbound-excel", label: "Nhập hàng mới (Excel)" }] }, { key: "transfer", label: "Chuyển hàng" }] },
  { label: "Khách hàng", icon: Users, children: [{ key: "customers", label: "Danh mục khách hàng" }, { key: "customer-new", label: "Tạo khách hàng mới" }] },
  { label: "Nhà cung cấp", icon: Truck, children: [{ key: "suppliers", label: "Danh mục nhà cung cấp" }, { key: "supplier-new", label: "Tạo NCC mới" }] },
  { key: "branches", label: "Chi nhánh", icon: Building2, adminOnly: true },
  { key: "inventory", label: "Quản lý tồn kho", icon: Package },
  { key: "debt", label: "Quản lý công nợ", icon: Wallet, adminOnly: true },
  { label: "Quản lý nhân viên", icon: UserCog, adminOnly: true, children: [{ key: "employees", label: "Danh sách nhân viên" }, { key: "roles", label: "Phân quyền nhân viên" }] },
  { key: "reports", label: "Báo cáo", icon: BarChart3, adminOnly: true },
];
const SALES_KEYS = ["dashboard", "sales", "sale-new", "customers", "customer-new"];
const salesCanSee = (node) => node.children ? node.children.some(salesCanSee) : SALES_KEYS.includes(node.key);

const NavNode = ({ node, depth = 0 }) => {
  const { page, nav, openMenus, toggleMenu, isAdmin, me } = useStore();
  const isSales = me.role !== "Admin";
  if (node.adminOnly && !isAdmin) return null;
  if (isSales && !salesCanSee(node)) return null; // Sales chỉ thấy đơn hàng + khách hàng
  const Ic = node.icon;
  if (!node.children) {
    const active = page === node.key;
    return <button onClick={() => nav(node.key)} className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium transition ${depth === 0 ? "px-3 py-2.5" : depth === 1 ? "pl-11 pr-3 py-2" : "pl-16 pr-3 py-2"} ${active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{Ic && <Ic size={19} />}<span className="truncate">{node.label}</span></button>;
  }
  const open = openMenus.includes(node.label);
  return <div><button onClick={() => toggleMenu(node.label)} className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 ${depth === 0 ? "px-3 py-2.5" : "pl-11 pr-3 py-2"}`}>{Ic && <Ic size={19} />}<span className="flex-1 text-left truncate">{node.label}</span><ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} /></button>{open && <div className="mt-0.5 space-y-0.5">{node.children.map((c, i) => <NavNode key={i} node={c} depth={depth + 1} />)}</div>}</div>;
};

/* ============ DASHBOARD ============ */
const Dashboard = () => {
  const { visSales, visProducts, customers, stock } = useStore();
  const revenue = visSales.reduce((s, o) => s + o.total, 0);
  const totalStock = Object.values(stock).reduce((a, b) => a + b, 0);
  const area = [{ m: "T1", v: 12 }, { m: "T2", v: 19 }, { m: "T3", v: 15 }, { m: "T4", v: 25 }, { m: "T5", v: 32 }, { m: "T6", v: 28 }];
  const grp = GROUPS.map((g) => ({ name: g, value: visProducts.filter((p) => p.group === g).length })).filter((x) => x.value);
  const COLORS = ["#2563eb", "#06b6d4", "#0ea5e9", "#3b82f6", "#22d3ee", "#60a5fa"];
  return <div><PageHead title="Dashboard" desc="Tổng quan hoạt động" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5"><StatCard icon={DollarSign} label="Doanh thu" value={fmt(revenue)} sub="+12%" color="blue" /><StatCard icon={ShoppingCart} label="Đơn hàng" value={visSales.length} sub="+8%" color="cyan" /><StatCard icon={Users} label="Khách hàng" value={customers.length} color="emerald" /><StatCard icon={Package} label="Tồn kho" value={totalStock} color="amber" /></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><Card className="p-5 lg:col-span-2"><h3 className="font-bold text-slate-800 mb-4">Doanh số 6 tháng</h3><ResponsiveContainer width="100%" height={240}><AreaChart data={area}><defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" /><XAxis dataKey="m" stroke="#94a3b8" fontSize={12} /><YAxis stroke="#94a3b8" fontSize={12} /><Tooltip /><Area type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={2.5} fill="url(#g1)" /></AreaChart></ResponsiveContainer></Card><Card className="p-5"><h3 className="font-bold text-slate-800 mb-4">Theo thể loại</h3><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={grp} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>{grp.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Card></div></div>;
};

/* ============ ĐƠN HÀNG ============ */
const SalesList = () => {
  const { visSales, setSales, customers, branches, nav, toast, isAdmin } = useStore();
  const { sel, toggle, toggleAll, allChecked, setSel } = useSel(visSales);
  const [view, setView] = useState(null);
  const [edit, setEdit] = useState(null);
  const cName = (id) => customers.find((c) => c.id === id)?.name || id;
  const bName = (id) => branches.find((b) => b.id === id)?.name || id;
  const done = (o) => o.paid >= o.total;
  const delSel = () => { setSales((p) => p.filter((o) => !sel.includes(o.id))); toast(`Đã xóa ${sel.length} đơn`); setSel([]); };
  const saveEdit = () => { setSales((p) => p.map((o) => o.id === edit.id ? edit : o)); toast("Đã cập nhật đơn"); setEdit(null); };
  return <div><PageHead title="Danh sách đơn hàng" desc={`${visSales.length} đơn`} action={<Btn onClick={() => nav("sale-new")}><Plus size={16} /> Tạo đơn</Btn>} />
    <BulkBar count={sel.length} onDelete={delSel} onClear={() => setSel([])} />
    <Table head={[<Check checked={allChecked} onChange={toggleAll} />, "Mã đơn", "Ngày", "Khách hàng", ...(isAdmin ? ["Chi nhánh"] : []), "Tổng", "Trạng thái", ""]}>
      {visSales.map((o) => <Row key={o.id}><Td><Check checked={sel.includes(o.id)} onChange={() => toggle(o.id)} /></Td><Td className="font-bold text-blue-600">{o.id}</Td><Td className="text-slate-500">{o.date}</Td><Td className="text-slate-700">{cName(o.customer)}</Td>{isAdmin && <Td className="text-slate-500">{bName(o.branchId)}</Td>}<Td className="font-semibold text-slate-800">{fmt(o.total)}</Td><Td>{done(o) ? <Badge cls="bg-emerald-50 text-emerald-600 ring-emerald-200">Hoàn thành</Badge> : <Badge cls="bg-amber-50 text-amber-600 ring-amber-200">Còn nợ</Badge>}</Td><Td><div className="flex gap-1"><button onClick={() => setView(o)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Eye size={16} /></button><button disabled={done(o)} onClick={() => setEdit({ ...o })} className={`p-1.5 rounded-lg ${done(o) ? "text-slate-300 cursor-not-allowed" : "hover:bg-amber-50 text-amber-600"}`} title={done(o) ? "Đơn đã hoàn thành - không sửa được" : "Sửa"}><Pencil size={16} /></button></div></Td></Row>)}
    </Table>
    {/* Xem chi tiết */}
    <Modal open={!!view} onClose={() => setView(null)} title={`Chi tiết đơn ${view?.id}`} size="lg">{view && <div className="space-y-4"><div className="grid grid-cols-2 gap-3 text-sm"><div><span className="text-slate-400">Khách hàng:</span> <b>{cName(view.customer)}</b></div><div><span className="text-slate-400">Ngày:</span> <b>{view.date}</b></div><div><span className="text-slate-400">Chi nhánh:</span> <b>{bName(view.branchId)}</b></div><div><span className="text-slate-400">Trạng thái:</span> {done(view) ? <b className="text-emerald-600">Hoàn thành</b> : <b className="text-amber-600">Còn nợ</b>}</div></div><Table head={["Sản phẩm", "SL", "Đơn giá", "Thành tiền"]}>{view.lines.map((l, i) => { const p = useStore().products.find((x) => x.id === l.sku); return <Row key={i}><Td>{p?.name || l.sku}</Td><Td>{l.qty}</Td><Td>{fmt(l.price)}</Td><Td className="font-semibold">{fmt(l.qty * l.price)}</Td></Row>; })}</Table><div className="text-right space-y-1 text-sm"><p>Giảm giá: {fmt(view.discount)}</p><p className="text-lg font-bold text-blue-600">Tổng: {fmt(view.total)}</p><p className="text-slate-500">Đã trả: {fmt(view.paid)}</p></div></div>}</Modal>
    {/* Sửa đơn */}
    <Modal open={!!edit} onClose={() => setEdit(null)} title={`Sửa đơn ${edit?.id}`} size="lg">{edit && <div className="space-y-4"><Select label="Khách hàng" value={edit.customer} onChange={(e) => setEdit({ ...edit, customer: e.target.value })}>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select><Input label="Giảm giá (₫)" type="number" value={edit.discount} onChange={(e) => setEdit({ ...edit, discount: Number(e.target.value), total: edit.lines.reduce((s, l) => s + l.qty * l.price, 0) - Number(e.target.value) })} /><Input label="Khách trả (₫)" type="number" value={edit.paid} onChange={(e) => setEdit({ ...edit, paid: Number(e.target.value) })} /><div className="flex justify-end gap-3"><Btn variant="ghost" onClick={() => setEdit(null)}>Hủy</Btn><Btn onClick={saveEdit}>Lưu thay đổi</Btn></div></div>}</Modal>
  </div>;
};
const SaleNew = () => {
  const { visProducts, customers, branches, stock, addSale, toast, nav, me } = useStore();
  const [cust, setCust] = useState(customers[0]?.id || "");
  const [br, setBr] = useState(me.branchId);
  const [lines, setLines] = useState([]); const [discount, setDiscount] = useState(0); const [paid, setPaid] = useState(0);
  const [picker, setPicker] = useState(false); const [q, setQ] = useState(""); const [sel, setSel] = useState([]);
  const filtered = visProducts.filter((p) => { const s = q.trim().toLowerCase(); return !s || p.name.toLowerCase().includes(s) || (p.artist || "").toLowerCase().includes(s) || p.id.toLowerCase().includes(s); });
  const toggleSel = (sku) => setSel((v) => v.includes(sku) ? v.filter((x) => x !== sku) : [...v, sku]);
  const addSelected = () => { const add = sel.filter((sku) => !lines.find((l) => l.sku === sku)).map((sku) => { const p = visProducts.find((x) => x.id === sku); return { sku, qty: 1, price: p.price }; }); if (!add.length) { toast("Chưa chọn sản phẩm mới!"); return; } setLines([...lines, ...add]); setSel([]); setQ(""); setPicker(false); toast(`Đã thêm ${add.length} sản phẩm`); };
  const upd = (sku, k, v) => setLines(lines.map((l) => l.sku === sku ? { ...l, [k]: Number(v) } : l));
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0) - discount;
  const save = () => { if (!lines.length) return toast("Chưa chọn sản phẩm!"); const bad = lines.find((l) => (stock[`${l.sku}-${br}`] || 0) < l.qty); if (bad) return toast("Tồn kho không đủ: " + bad.sku); addSale({ id: rnd("DB"), date: today(), customer: cust, branchId: br, discount, total, paid, lines }); toast("Tạo đơn thành công!"); nav("sales"); };
  return <div className="max-w-4xl"><PageHead title="Tạo đơn hàng mới" /><Card className="p-5 sm:p-6 space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Select label="Khách hàng" value={cust} onChange={(e) => setCust(e.target.value)}>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select><Select label="Chi nhánh bán" value={br} onChange={(e) => setBr(e.target.value)}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></div>
    <div><Btn variant="outline" onClick={() => setPicker(true)}><Plus size={16} /> Chọn sản phẩm</Btn></div>
    {lines.length > 0 && <Table head={["Sản phẩm", "SL", "Đơn giá", "Thành tiền", ""]}>{lines.map((l) => { const p = visProducts.find((x) => x.id === l.sku); return <Row key={l.sku}><Td><span className="font-medium">{p.name}</span>{p.artist && <span className="block text-xs text-slate-400">{p.artist}</span>}</Td><Td><input type="number" min="1" value={l.qty} onChange={(e) => upd(l.sku, "qty", e.target.value)} className="w-16 px-2 py-1 border rounded-lg" /></Td><Td>{fmt(l.price)}</Td><Td className="font-semibold">{fmt(l.qty * l.price)}</Td><Td><button onClick={() => setLines(lines.filter((x) => x.sku !== l.sku))} className="text-rose-500 p-1.5"><Trash2 size={16} /></button></Td></Row>; })}</Table>}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label="Giảm giá" type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /><Input label="Khách trả" type="number" value={paid} onChange={(e) => setPaid(Number(e.target.value))} /></div>
    <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-3"><span className="text-lg font-bold">Tổng: <span className="text-blue-600">{fmt(total)}</span></span><Btn onClick={save}><CheckCircle2 size={16} /> Lưu đơn</Btn></div></Card>
    <Modal open={picker} onClose={() => setPicker(false)} title="Chọn sản phẩm" size="lg"><div className="space-y-3"><Input placeholder="Tìm theo tên album, nghệ sĩ, SKU..." value={q} onChange={(e) => setQ(e.target.value)} /><div className="max-h-96 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100">{filtered.length === 0 ? <p className="p-4 text-center text-slate-400 text-sm">Không tìm thấy</p> : filtered.map((p) => { const st = stock[`${p.id}-${br}`] || 0; const added = lines.find((l) => l.sku === p.id); return <label key={p.id} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 ${added ? "opacity-40" : ""}`}><Check checked={sel.includes(p.id) || !!added} onChange={() => !added && toggleSel(p.id)} /><div className="flex-1 min-w-0"><p className="font-medium text-slate-700 truncate">{p.name} {added && <span className="text-xs text-emerald-500">(đã thêm)</span>}</p><p className="text-xs text-slate-400">{p.artist || "—"} · {p.id}</p></div><div className="text-right"><p className="text-sm font-semibold text-blue-600">{fmt(p.price)}</p><p className="text-xs text-slate-400">Tồn: {st}</p></div></label>; })}</div><div className="flex justify-end gap-3"><Btn variant="ghost" onClick={() => setPicker(false)}>Đóng</Btn><Btn onClick={addSelected}>Thêm {sel.length ? `(${sel.length})` : ""}</Btn></div></div></Modal>
  </div>;
};

/* ============ SẢN PHẨM ============ */
const Products = () => {
  const { visProducts, setProducts, branches, stock, nav, toast, isAdmin, canSeeCost, stockHistory } = useStore();
  const [q, setQ] = useState(""); const [fBranch, setFBranch] = useState("all"); const [detail, setDetail] = useState(null); const [edit, setEdit] = useState(null); const [grouped, setGrouped] = useState(false); const [openArtist, setOpenArtist] = useState([]);
  let list = visProducts.filter((p) => (p.name + " " + p.artist + " " + p.id).toLowerCase().includes(q.toLowerCase()));
  if (fBranch !== "all") list = list.filter((p) => p.branchId === fBranch);
  const { sel, toggle, toggleAll, allChecked, setSel } = useSel(list);
  const totalStock = (sku) => Object.entries(stock).filter(([k]) => k.startsWith(sku + "-")).reduce((a, [, v]) => a + v, 0);
  const bName = (id) => branches.find((b) => b.id === id)?.name || id;
  const delSel = () => { setProducts((p) => p.filter((x) => !sel.includes(x.id))); toast(`Đã xóa ${sel.length} sản phẩm`); setSel([]); };
  const save = () => { setProducts((p) => p.map((x) => x.id === edit.id ? { ...edit, cost: Number(edit.cost), price: Number(edit.price), updatedAt: today() } : x)); toast("Đã cập nhật sản phẩm"); setEdit(null); };
  const toggleArtist = (a) => setOpenArtist((o) => o.includes(a) ? o.filter((x) => x !== a) : [...o, a]);
  // Gom theo nghệ sĩ
  const groups = {}; list.forEach((p) => { const a = p.artist || "(Chưa rõ nghệ sĩ)"; (groups[a] = groups[a] || []).push(p); });
  const artistNames = Object.keys(groups).sort((a, b) => a.localeCompare(b, "vi"));
  return <div><PageHead title="Danh sách sản phẩm" desc={`${list.length} sản phẩm${grouped ? ` · ${artistNames.length} nghệ sĩ` : ""}`} action={<Btn onClick={() => nav("product-new")}><Plus size={16} /> Tạo sản phẩm</Btn>} />
    <div className="flex gap-3 mb-4 flex-wrap"><div className="relative flex-1 min-w-[200px]"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm album, nghệ sĩ, SKU..." className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-500" /></div>{isAdmin && <select value={fBranch} onChange={(e) => setFBranch(e.target.value)} className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"><option value="all">Tất cả chi nhánh</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}<button onClick={() => setGrouped((g) => !g)} className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 ${grouped ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"}`}><Users size={16} /> Gom theo nghệ sĩ</button></div>
    {!grouped && <>
    <BulkBar count={sel.length} onDelete={delSel} onClear={() => setSel([])} />
    <Table head={[<Check checked={allChecked} onChange={toggleAll} />, "Ảnh", "SKU", "Nghệ sĩ", "Album", "Nhãn hiệu", ...(isAdmin ? ["Chi nhánh"] : []), ...(canSeeCost ? ["Giá nhập"] : []), "Giá bán", "Tồn", ""]}>
      {list.map((p) => <Row key={p.id}><Td><Check checked={sel.includes(p.id)} onChange={() => toggle(p.id)} /></Td><Td><img src={p.img} alt="" className="w-9 h-9 rounded-lg object-cover" /></Td><Td><button onClick={() => setDetail(p)} className="font-bold text-blue-600 hover:underline">{p.id}</button></Td><Td><button onClick={() => { setQ(p.artist); setGrouped(true); setOpenArtist([p.artist]); }} className="text-left font-medium text-slate-700 hover:text-blue-600 hover:underline">{p.artist || "—"}</button></Td><Td><button onClick={() => setDetail(p)} className="text-left text-slate-800 font-medium hover:text-blue-600 hover:underline">{p.name}</button></Td><Td className="text-slate-500">{p.brand}</Td>{isAdmin && <Td className="text-slate-500">{bName(p.branchId)}</Td>}{canSeeCost && <Td className="text-slate-600">{fmt(p.cost)}</Td>}<Td className="font-semibold">{fmt(p.price)}</Td><Td className="text-slate-700">{totalStock(p.id)}</Td><Td><div className="flex gap-1"><button onClick={() => setDetail(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Eye size={16} /></button><button onClick={() => setEdit({ ...p })} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"><Pencil size={16} /></button></div></Td></Row>)}
    </Table></>}
    {grouped && <div className="space-y-3">{artistNames.map((a) => { const albums = groups[a]; const open = openArtist.includes(a); const artistStock = albums.reduce((s, p) => s + totalStock(p.id), 0); return <Card key={a} className="overflow-hidden"><button onClick={() => toggleArtist(a)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">{a[0]}</div><div className="flex-1"><p className="font-bold text-slate-800">{a}</p><p className="text-xs text-slate-400">{albums.length} album · Tổng tồn: {artistStock}</p></div><ChevronDown size={18} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} /></button>{open && <div className="border-t border-slate-100 divide-y divide-slate-50">{albums.map((p) => <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50"><img src={p.img} alt="" className="w-9 h-9 rounded-lg object-cover" /><button onClick={() => setDetail(p)} className="flex-1 text-left"><p className="font-medium text-slate-800 hover:text-blue-600">{p.name}</p><p className="text-xs text-slate-400">{p.id} · {p.brand}</p></button><span className="text-sm font-semibold text-blue-600">{fmt(p.price)}</span><span className="text-sm text-slate-500 w-14 text-right">Tồn: {totalStock(p.id)}</span><div className="flex gap-1"><button onClick={() => setDetail(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Eye size={16} /></button><button onClick={() => setEdit({ ...p })} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"><Pencil size={16} /></button></div></div>)}</div>}</Card>; })}{!artistNames.length && <p className="text-center text-slate-400 py-8 text-sm">Không tìm thấy nghệ sĩ nào.</p>}</div>}
    <Modal open={!!detail} onClose={() => setDetail(null)} title="Chi tiết sản phẩm" size="xl">{detail && <div className="space-y-4"><div className="grid grid-cols-1 sm:grid-cols-3 gap-5"><div><img src={detail.img} alt="" className="w-full rounded-xl border border-slate-200" /></div><div className="sm:col-span-2 space-y-3 text-sm"><h3 className="text-lg font-bold text-slate-800">{detail.name}</h3><div className="grid grid-cols-2 gap-2"><div><span className="text-slate-400">Mã SKU:</span> <b>{detail.id}</b></div><div><span className="text-slate-400">Barcode:</span> <b>{detail.barcode}</b></div><div><span className="text-slate-400">Loại:</span> <b>{detail.group}</b></div><div><span className="text-slate-400">Nhãn hiệu:</span> <b>{detail.brand}</b></div><div><span className="text-slate-400">Nghệ sĩ:</span> <b>{detail.artist}</b></div><div><span className="text-slate-400">Chi nhánh:</span> <b>{bName(detail.branchId)}</b></div><div><span className="text-slate-400">Ngày tạo:</span> <b>{detail.createdAt}</b></div><div><span className="text-slate-400">Cập nhật:</span> <b>{detail.updatedAt}</b></div>{canSeeCost && <div><span className="text-slate-400">Giá nhập:</span> <b>{fmt(detail.cost)}</b></div>}<div><span className="text-slate-400">Giá bán lẻ:</span> <b className="text-blue-600">{fmt(detail.price)}</b></div></div><p className="text-slate-600"><span className="text-slate-400">Mô tả:</span> {detail.desc}</p><div><p className="font-semibold text-slate-700 mb-1.5">Tồn kho theo chi nhánh:</p><div className="flex flex-wrap gap-2">{branches.map((b) => { const q = stock[`${detail.id}-${b.id}`] || 0; return <Badge key={b.id} cls={q > 0 ? "bg-emerald-50 text-emerald-600 ring-emerald-200" : "bg-slate-100 text-slate-400 ring-slate-200"}>{b.name}: {q}</Badge>; })}</div></div><div><p className="font-semibold text-slate-700 mb-1.5">Lịch sử kho:</p><div className="max-h-40 overflow-y-auto space-y-1">{stockHistory.filter((h) => h.sku === detail.id).length ? stockHistory.filter((h) => h.sku === detail.id).map((h, i) => <div key={i} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-slate-50"><span className="text-slate-500">{h.time} · {h.doc}</span><Badge cls={h.type === "Nhập kho" ? "bg-blue-50 text-blue-600 ring-blue-200" : "bg-rose-50 text-rose-600 ring-rose-200"}>{h.type} {h.qty > 0 ? "+" : ""}{h.qty}</Badge></div>) : <p className="text-xs text-slate-400">Chưa có lịch sử.</p>}</div></div></div></div><div className="flex justify-end gap-3 pt-3 border-t border-slate-100"><Btn variant="ghost" onClick={() => setDetail(null)}>Đóng</Btn><Btn onClick={() => { setEdit({ ...detail }); setDetail(null); }}><Pencil size={16} /> Chỉnh sửa</Btn></div></div>}</Modal>
    <Modal open={!!edit} onClose={() => setEdit(null)} title={`Sửa sản phẩm ${edit?.id}`} size="lg">{edit && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label="Tên album *" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /><Input label="Nghệ sĩ" value={edit.artist} onChange={(e) => setEdit({ ...edit, artist: e.target.value })} /><Input label="Nhãn hiệu" value={edit.brand} onChange={(e) => setEdit({ ...edit, brand: e.target.value })} /><Input label="Barcode" value={edit.barcode} onChange={(e) => setEdit({ ...edit, barcode: e.target.value })} /><Select label="Loại" value={edit.group} onChange={(e) => setEdit({ ...edit, group: e.target.value })}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</Select><Select label="Chi nhánh" value={edit.branchId} onChange={(e) => setEdit({ ...edit, branchId: e.target.value })}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>{canSeeCost && <Input label="Giá nhập" type="number" value={edit.cost} onChange={(e) => setEdit({ ...edit, cost: e.target.value })} />}<Input label="Giá bán" type="number" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /><div className="sm:col-span-2"><Input label="Mô tả" value={edit.desc} onChange={(e) => setEdit({ ...edit, desc: e.target.value })} /></div><div className="sm:col-span-2 flex justify-end gap-3"><Btn variant="ghost" onClick={() => setEdit(null)}>Hủy</Btn><Btn onClick={save}>Lưu thay đổi</Btn></div></div>}</Modal>
  </div>;
};

const ProductNew = () => {
  const { products, setProducts, branches, toast, nav, me, canSeeCost } = useStore();
  const [f, setF] = useState({ name: "", artist: "", brand: "", barcode: "", desc: "", group: GROUPS[0], cost: 0, price: 0, branchId: me.branchId, img: "" });
  const set = (k, v) => setF({ ...f, [k]: v });
  const save = () => { if (!f.name) return toast("Nhập tên album!"); const id = "SKU" + String(products.length + 1).padStart(3, "0"); setProducts([...products, { id, ...f, cost: Number(f.cost), price: Number(f.price), img: f.img || IMG(f.name.slice(0, 6)), createdAt: today(), updatedAt: today() }]); toast("Đã tạo " + id); nav("products"); };
  return <div className="max-w-2xl"><PageHead title="Tạo sản phẩm mới" /><Card className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label="Tên album *" value={f.name} onChange={(e) => set("name", e.target.value)} /><Input label="Nghệ sĩ" value={f.artist} onChange={(e) => set("artist", e.target.value)} /><Input label="Nhãn hiệu (hãng đĩa)" value={f.brand} onChange={(e) => set("brand", e.target.value)} /><Input label="Barcode" value={f.barcode} onChange={(e) => set("barcode", e.target.value)} /><Select label="Loại sản phẩm" value={f.group} onChange={(e) => set("group", e.target.value)}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</Select><Select label="Chi nhánh" value={f.branchId} onChange={(e) => set("branchId", e.target.value)}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>{canSeeCost && <Input label="Giá nhập" type="number" value={f.cost} onChange={(e) => set("cost", e.target.value)} />}<Input label="Giá bán lẻ" type="number" value={f.price} onChange={(e) => set("price", e.target.value)} /><div className="sm:col-span-2"><Input label="Mô tả" value={f.desc} onChange={(e) => set("desc", e.target.value)} /></div><div className="sm:col-span-2"><label className="text-sm font-medium text-slate-600">Hình ảnh sản phẩm</label><div className="mt-1 flex items-center gap-4">{f.img && <img src={f.img} alt="" className="w-24 h-24 object-cover rounded-xl border" />}<label className="cursor-pointer px-4 py-2 rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 hover:bg-slate-50">📷 Chọn ảnh<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files[0]; if (file) set("img", await resizeImage(file)); }} /></label></div></div><div className="sm:col-span-2 flex justify-end gap-3"><Btn variant="ghost" onClick={() => nav("products")}>Hủy</Btn><Btn onClick={save}>Lưu</Btn></div></Card></div>;
};

/* ============ NHẬP HÀNG ============ */
const InboundList = () => {
  const { visInbounds, suppliers, branches, nav } = useStore();
  const sName = (id) => suppliers.find((s) => s.id === id)?.name || id;
  const bName = (id) => branches.find((b) => b.id === id)?.name || id;
  const total = (ib) => ib.lines.reduce((s, l) => s + l.qty * l.price, 0) - ib.discount;
  return <div><PageHead title="Danh sách phiếu nhập" desc={`${visInbounds.length} phiếu`} action={<Btn onClick={() => nav("inbound-excel")}><UploadCloud size={16} /> Nhập Excel</Btn>} /><Table head={["Mã phiếu", "Ngày", "NCC", "Chi nhánh", "Tổng"]}>{visInbounds.map((ib) => <Row key={ib.id}><Td className="font-bold text-blue-600">{ib.id}</Td><Td className="text-slate-500">{ib.date}</Td><Td>{sName(ib.supplier)}</Td><Td className="text-slate-500">{bName(ib.branchId)}</Td><Td className="font-semibold">{fmt(total(ib))}</Td></Row>)}</Table></div>;
};
const InboundExcel = () => {
  const { toast, importProducts, products, suppliers, branches, addSupplier, me } = useStore();
  const [supplier, setSupplier] = useState(""); const [br, setBr] = useState(me.branchId);
  const [showAdd, setShowAdd] = useState(false); const [newSup, setNewSup] = useState({ name: "", phone: "", email: "", address: "" });
  const [drag, setDrag] = useState(false); const [fileName, setFileName] = useState(null); const [rows, setRows] = useState([]); const [errors, setErrors] = useState([]); const [loading, setLoading] = useState(false); const [XLSX, setXLSX] = useState(null);
  React.useEffect(() => { import("xlsx").then((m) => setXLSX(m)); }, []);
  const COL = { name: ["tên sản phẩm", "tên album", "album", "name"], artist: ["nghệ sĩ", "nghe si", "artist", "ca sĩ", "ban nhạc", "ban nhac"], sku: ["sku", "mã sku"], barcode: ["barcode", "mã vạch"], desc: ["mô tả", "desc"], group: ["loại sản phẩm", "loại", "thể loại"], brand: ["nhãn hiệu", "brand", "hãng"], qty: ["số lượng", "so luong", "qty", "sl"], cost: ["giá nhập", "giá vốn", "cost"], price: ["giá bán", "giá bán lẻ", "price"] };
  const cols = ["Album *", "Nghệ sĩ", "Mã SKU", "Barcode", "Mô tả", "Loại sản phẩm", "Nhãn hiệu", "Số lượng *", "Giá nhập", "Giá bán"];
  const fk = (h, v) => h.find((x) => v.includes(String(x).trim().toLowerCase()));
  const parse = (file) => { if (!file || !XLSX) return; if (!/\.(xlsx|xls|csv)$/i.test(file.name)) return toast("Chọn file Excel!"); setLoading(true); setFileName(file.name); const r = new FileReader(); r.onload = (e) => { try { const wb = XLSX.read(e.target.result, { type: "array" }); const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }); if (!json.length) { toast("File rỗng!"); setLoading(false); return; } const H = Object.keys(json[0]); const K = {}; Object.entries(COL).forEach(([k, v]) => (K[k] = fk(H, v))); if (!K.name) { toast("Thiếu cột bắt buộc: Album"); setLoading(false); return; } let auto = products.length + 1; const P = [], E = []; json.forEach((row, i) => { const name = String(row[K.name] || "").trim(); const artist = K.artist ? String(row[K.artist] || "").trim() : ""; const qty = K.qty ? Number(String(row[K.qty]).replace(/[^\d.-]/g, "")) || 0 : 0; let sku = K.sku ? String(row[K.sku] || "").trim() : ""; const isAuto = !sku; if (!sku) sku = "SKU" + String(auto++).padStart(3, "0"); const rec = { id: sku, name, artist, brand: K.brand ? String(row[K.brand] || "").trim() : "", barcode: K.barcode ? String(row[K.barcode] || "").trim() : "", desc: K.desc ? String(row[K.desc] || "").trim() : "", group: K.group ? String(row[K.group] || GROUPS[0]).trim() : GROUPS[0], qty, cost: Number(String(row[K.cost]).replace(/[^\d.-]/g, "")) || 0, price: Number(String(row[K.price]).replace(/[^\d.-]/g, "")) || 0, _row: i + 2, _valid: !!name && qty > 0, _auto: isAuto, _isNew: !products.find((p) => p.id === sku) }; P.push(rec); if (!name) E.push(`Dòng ${i + 2}: thiếu tên album`); else if (qty <= 0) E.push(`Dòng ${i + 2}: số lượng phải > 0`); }); setRows(P); setErrors(E); setLoading(false); toast(`Đã đọc ${P.length} dòng!`); } catch { toast("Lỗi đọc file!"); setLoading(false); } }; r.readAsArrayBuffer(file); };
  const doImport = () => { if (!supplier) return toast("Chọn nhà cung cấp!"); const v = rows.filter((r) => r._valid); if (!v.length) return toast("Không có dòng hợp lệ!"); importProducts(v.map((r) => ({ id: r.id, name: r.name, artist: r.artist, brand: r.brand, barcode: r.barcode, desc: r.desc, group: r.group, qty: r.qty, cost: r.cost, price: r.price, branchId: br })), br, supplier); toast(`Import ${v.length} sản phẩm!`); setRows([]); setFileName(null); setErrors([]); };
  const dl = () => { if (!XLSX) return; const ws = XLSX.utils.json_to_sheet([{ "Album": "OK Computer", "Nghệ sĩ": "Radiohead", "Mã SKU": "", "Barcode": "8935101", "Mô tả": "Album 1997", "Loại sản phẩm": "Rock", "Nhãn hiệu": "Parlophone", "Số lượng": 10, "Giá nhập": 600000, "Giá bán": 990000 }, { "Album": "Kind of Blue", "Nghệ sĩ": "Miles Davis", "Mã SKU": "", "Barcode": "8935102", "Mô tả": "Album 1959", "Loại sản phẩm": "Jazz", "Nhãn hiệu": "Columbia", "Số lượng": 5, "Giá nhập": 550000, "Giá bán": 890000 }]); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "DiaThan"); XLSX.writeFile(wb, "mau_import.xlsx"); toast("Đã tải file mẫu!"); };
  const saveSup = () => { if (!newSup.name) return toast("Nhập tên NCC!"); const id = addSupplier(newSup); setSupplier(id); setShowAdd(false); setNewSup({ name: "", phone: "", email: "", address: "" }); toast("Đã thêm NCC"); };
  const vc = rows.filter((r) => r._valid).length;
  return <div className="max-w-5xl"><PageHead title="Nhập hàng mới (Excel)" desc="Mã SKU để trống → hệ thống tự cấp" /><Card className="p-5 mb-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end"><div className="flex items-end gap-2"><div className="flex-1"><Select label="Nhà cung cấp *" value={supplier} onChange={(e) => setSupplier(e.target.value)}><option value="">-- Chọn NCC --</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div><Btn variant="outline" onClick={() => setShowAdd(true)}><Plus size={16} /></Btn></div><Select label="Chi nhánh nhập" value={br} onChange={(e) => setBr(e.target.value)}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></div></Card>
    <Card className="p-5 sm:p-6"><div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); parse(e.dataTransfer.files[0]); }} className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${drag ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}>{loading ? <div className="py-4"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" /><p className="text-slate-500 text-sm">Đang đọc...</p></div> : <><UploadCloud size={40} className={`mx-auto mb-3 ${drag ? "text-blue-500" : "text-slate-300"}`} /><p className="text-slate-700 font-semibold">Kéo & thả file Excel</p><label className="inline-block mt-3 cursor-pointer"><span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm hover:bg-slate-200">Chọn file</span><input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => parse(e.target.files[0])} /></label>{fileName && <p className="mt-4 text-emerald-600 text-sm flex items-center justify-center gap-2"><FileSpreadsheet size={16} /> {fileName}</p>}</>}</div><div className="mt-4 flex flex-wrap gap-2">{cols.map((c) => <span key={c} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium ring-1 ring-blue-200">{c}</span>)}</div><div className="flex gap-3 mt-5"><Btn variant="outline" onClick={dl} className="flex-1"><Download size={16} /> File mẫu</Btn><Btn onClick={doImport} disabled={!vc} className="flex-1"><UploadCloud size={16} /> Import {vc ? `(${vc})` : ""}</Btn></div></Card>
    {errors.length > 0 && <Card className="p-4 mt-4 border-rose-200"><p className="text-sm font-semibold text-rose-600 flex items-center gap-2 mb-2"><AlertTriangle size={16} /> {errors.length} lỗi</p><ul className="text-xs text-slate-500 space-y-1">{errors.map((e, i) => <li key={i}>• {e}</li>)}</ul></Card>}
    {rows.length > 0 && <div className="mt-4"><Table head={["Dòng", "SKU", "Nghệ sĩ", "Album", "Nhãn hiệu", "Loại", "SL", "Giá bán", "Trạng thái"]}>{rows.map((r, i) => <Row key={i}><Td className="text-slate-400">{r._row}</Td><Td className="font-bold text-blue-600">{r.id} {r._auto && <span className="text-[10px] text-cyan-500">(auto)</span>}</Td><Td className="font-medium text-slate-700">{r.artist || "—"}</Td><Td>{r.name || "—"}</Td><Td className="text-slate-500">{r.brand || "—"}</Td><Td className="text-slate-500">{r.group}</Td><Td className="font-semibold text-center">{r.qty || 0}</Td><Td className="font-semibold">{fmt(r.price)}</Td><Td>{!r._valid ? <Badge cls="bg-rose-50 text-rose-600 ring-rose-200">Lỗi</Badge> : r._isNew ? <Badge cls="bg-cyan-50 text-cyan-600 ring-cyan-200">Tạo mới</Badge> : <Badge cls="bg-slate-100 text-slate-600 ring-slate-200">Cập nhật</Badge>}</Td></Row>)}</Table></div>}
    <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Thêm nhà cung cấp"><div className="space-y-4"><Input label="Tên NCC *" value={newSup.name} onChange={(e) => setNewSup({ ...newSup, name: e.target.value })} /><Input label="Điện thoại" value={newSup.phone} onChange={(e) => setNewSup({ ...newSup, phone: e.target.value })} /><Input label="Email" value={newSup.email} onChange={(e) => setNewSup({ ...newSup, email: e.target.value })} /><Input label="Địa chỉ" value={newSup.address} onChange={(e) => setNewSup({ ...newSup, address: e.target.value })} /><div className="flex justify-end gap-3"><Btn variant="ghost" onClick={() => setShowAdd(false)}>Hủy</Btn><Btn onClick={saveSup}>Lưu</Btn></div></div></Modal>
  </div>;
};
const Transfer = () => {
  const { visProducts, branches, stock, doTransfer, toast } = useStore();
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [picker, setPicker] = useState(false); const [q, setQ] = useState(""); const [sel, setSel] = useState([]); const [lines, setLines] = useState([]);
  const filtered = visProducts.filter((p) => { const s = q.trim().toLowerCase(); return !s || p.name.toLowerCase().includes(s) || (p.artist || "").toLowerCase().includes(s) || p.id.toLowerCase().includes(s); });
  const toggleSel = (sku) => setSel((v) => v.includes(sku) ? v.filter((x) => x !== sku) : [...v, sku]);
  const addSelected = () => { const add = sel.filter((sku) => !lines.find((l) => l.sku === sku)).map((sku) => ({ sku, qty: 1 })); if (!add.length) { toast("Chưa chọn sản phẩm mới!"); return; } setLines([...lines, ...add]); setSel([]); setQ(""); setPicker(false); };
  const upd = (sku, v) => setLines(lines.map((l) => l.sku === sku ? { ...l, qty: Number(v) } : l));
  const go = () => { if (!from || !to || from === to) return toast("Chọn 2 chi nhánh khác nhau!"); if (!lines.length) return toast("Chưa chọn sản phẩm!"); const bad = lines.find((l) => l.qty <= 0 || (stock[`${l.sku}-${from}`] || 0) < l.qty); if (bad) return toast("Không đủ hàng / SL sai: " + bad.sku); lines.forEach((l) => doTransfer(l.sku, from, to, Number(l.qty))); toast(`Đã chuyển ${lines.length} sản phẩm!`); setLines([]); };
  return <div className="max-w-3xl"><PageHead title="Chuyển hàng giữa chi nhánh" /><Card className="p-5 sm:p-6 space-y-4"><div className="grid grid-cols-2 gap-4"><Select label="Từ chi nhánh" value={from} onChange={(e) => setFrom(e.target.value)}><option value="">--</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select><Select label="Đến chi nhánh" value={to} onChange={(e) => setTo(e.target.value)}><option value="">--</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></div>
    <div><Btn variant="outline" onClick={() => { if (!from) return toast("Chọn chi nhánh nguồn trước!"); setPicker(true); }}><Plus size={16} /> Chọn sản phẩm</Btn></div>
    {lines.length > 0 && <Table head={["Sản phẩm", "Tồn nguồn", "SL chuyển", ""]}>{lines.map((l) => { const p = visProducts.find((x) => x.id === l.sku); const st = stock[`${l.sku}-${from}`] || 0; return <Row key={l.sku}><Td><span className="font-medium">{p.name}</span>{p.artist && <span className="block text-xs text-slate-400">{p.artist}</span>}</Td><Td className="text-slate-500">{st}</Td><Td><input type="number" min="1" value={l.qty} onChange={(e) => upd(l.sku, e.target.value)} className="w-16 px-2 py-1 border rounded-lg" /></Td><Td><button onClick={() => setLines(lines.filter((x) => x.sku !== l.sku))} className="text-rose-500 p-1.5"><Trash2 size={16} /></button></Td></Row>; })}</Table>}
    <div className="flex justify-end pt-4 border-t border-slate-100"><Btn onClick={go}><ArrowRightLeft size={16} /> Chuyển {lines.length ? `(${lines.length})` : ""}</Btn></div></Card>
    <Modal open={picker} onClose={() => setPicker(false)} title="Chọn sản phẩm chuyển" size="lg"><div className="space-y-3"><Input placeholder="Tìm theo tên album, nghệ sĩ, SKU..." value={q} onChange={(e) => setQ(e.target.value)} /><div className="max-h-96 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100">{filtered.length === 0 ? <p className="p-4 text-center text-slate-400 text-sm">Không tìm thấy</p> : filtered.map((p) => { const st = stock[`${p.id}-${from}`] || 0; const added = lines.find((l) => l.sku === p.id); return <label key={p.id} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 ${added ? "opacity-40" : ""}`}><Check checked={sel.includes(p.id) || !!added} onChange={() => !added && toggleSel(p.id)} /><div className="flex-1 min-w-0"><p className="font-medium text-slate-700 truncate">{p.name} {added && <span className="text-xs text-emerald-500">(đã thêm)</span>}</p><p className="text-xs text-slate-400">{p.artist || "—"} · {p.id}</p></div><p className="text-xs text-slate-400">Tồn: {st}</p></label>; })}</div><div className="flex justify-end gap-3"><Btn variant="ghost" onClick={() => setPicker(false)}>Đóng</Btn><Btn onClick={addSelected}>Thêm {sel.length ? `(${sel.length})` : ""}</Btn></div></div></Modal>
  </div>;
};

/* ============ KHÁCH HÀNG / NCC ============ */
const Customers = () => {
  const { customers, setCustomers, sales, nav, toast } = useStore();
  const { sel, toggle, toggleAll, allChecked, setSel } = useSel(customers);
  const [detail, setDetail] = useState(null); const [edit, setEdit] = useState(null);
  const bought = (id) => sales.filter((s) => s.customer === id).reduce((a, s) => a + s.total, 0);
  const gb = { VIP: "bg-amber-50 text-amber-600 ring-amber-200", "Thân thiết": "bg-cyan-50 text-cyan-600 ring-cyan-200", "Mới": "bg-slate-100 text-slate-600 ring-slate-200" };
  const del = () => { setCustomers((p) => p.filter((c) => !sel.includes(c.id))); toast(`Đã xóa ${sel.length}`); setSel([]); };
  const save = () => { setCustomers((p) => p.map((c) => c.id === edit.id ? { ...edit, debt: Number(edit.debt) } : c)); toast("Đã cập nhật khách hàng"); setEdit(null); };
  return <div><PageHead title="Danh mục khách hàng" desc={`${customers.length} khách`} action={<Btn onClick={() => nav("customer-new")}><Plus size={16} /> Tạo mới</Btn>} /><BulkBar count={sel.length} onDelete={del} onClear={() => setSel([])} />
    <Table head={[<Check checked={allChecked} onChange={toggleAll} />, "Mã KH", "Tên", "SĐT", "Nhóm", "Tổng đã mua", "Công nợ", ""]}>{customers.map((c) => <Row key={c.id}><Td><Check checked={sel.includes(c.id)} onChange={() => toggle(c.id)} /></Td><Td><button onClick={() => setDetail(c)} className="font-bold text-blue-600 hover:underline">{c.id}</button></Td><Td><button onClick={() => setDetail(c)} className="font-medium text-slate-800 hover:text-blue-600 hover:underline">{c.name}</button></Td><Td className="text-slate-500">{c.phone}</Td><Td><Badge cls={gb[c.group]}>{c.group}</Badge></Td><Td className="font-semibold text-emerald-600">{fmt(bought(c.id))}</Td><Td className={c.debt > 0 ? "text-rose-600 font-medium" : "text-slate-400"}>{fmt(c.debt)}</Td><Td><div className="flex gap-1"><button onClick={() => setDetail(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Eye size={16} /></button><button onClick={() => setEdit({ ...c })} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"><Pencil size={16} /></button></div></Td></Row>)}</Table>
    <Modal open={!!detail} onClose={() => setDetail(null)} title={`Chi tiết khách hàng ${detail?.id}`} size="lg">{detail && <div className="space-y-4"><div className="grid grid-cols-2 gap-3 text-sm"><div><span className="text-slate-400">Tên:</span> <b>{detail.name}</b></div><div><span className="text-slate-400">Điện thoại:</span> <b>{detail.phone}</b></div><div><span className="text-slate-400">Email:</span> <b>{detail.email || "—"}</b></div><div><span className="text-slate-400">Nhóm:</span> <b>{detail.group}</b></div><div className="col-span-2"><span className="text-slate-400">Địa chỉ:</span> <b>{detail.address || "—"}</b></div><div><span className="text-slate-400">Tổng đã mua:</span> <b className="text-emerald-600">{fmt(bought(detail.id))}</b></div><div><span className="text-slate-400">Công nợ:</span> <b className={detail.debt > 0 ? "text-rose-600" : ""}>{fmt(detail.debt)}</b></div></div><div className="flex justify-end gap-3 pt-3 border-t border-slate-100"><Btn variant="ghost" onClick={() => setDetail(null)}>Đóng</Btn><Btn onClick={() => { setEdit({ ...detail }); setDetail(null); }}><Pencil size={16} /> Chỉnh sửa</Btn></div></div>}</Modal>
    <Modal open={!!edit} onClose={() => setEdit(null)} title={`Sửa khách hàng ${edit?.id}`}>{edit && <div className="space-y-4"><Input label="Tên *" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /><Input label="Điện thoại" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /><Input label="Email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /><Select label="Nhóm" value={edit.group} onChange={(e) => setEdit({ ...edit, group: e.target.value })}><option>Mới</option><option>Thân thiết</option><option>VIP</option></Select><Input label="Địa chỉ" value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} /><Input label="Công nợ" type="number" value={edit.debt} onChange={(e) => setEdit({ ...edit, debt: e.target.value })} /><div className="flex justify-end gap-3"><Btn variant="ghost" onClick={() => setEdit(null)}>Hủy</Btn><Btn onClick={save}>Lưu thay đổi</Btn></div></div>}</Modal>
  </div>;
};
const CustomerNew = () => {
  const { customers, setCustomers, branches, toast, nav, me } = useStore();
  const [f, setF] = useState({ name: "", phone: "", email: "", address: "", group: "Mới", branchId: me.branchId });
  const set = (k, v) => setF({ ...f, [k]: v });
  const save = () => { if (!f.name) return toast("Nhập tên khách hàng!"); const id = "KH" + String(customers.length + 1).padStart(2, "0"); setCustomers([...customers, { id, ...f, debt: 0 }]); toast("Đã thêm " + id); nav("customers"); };
  return <div className="max-w-2xl"><PageHead title="Thêm khách hàng" /><Card className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label="Tên khách hàng *" value={f.name} onChange={(e) => set("name", e.target.value)} /><Input label="Số điện thoại" value={f.phone} onChange={(e) => set("phone", e.target.value)} /><Input label="Email" value={f.email} onChange={(e) => set("email", e.target.value)} /><Select label="Nhóm khách" value={f.group} onChange={(e) => set("group", e.target.value)}>{["Mới", "Thân thiết", "VIP"].map((g) => <option key={g}>{g}</option>)}</Select><Select label="Chi nhánh" value={f.branchId} onChange={(e) => set("branchId", e.target.value)}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select><div className="sm:col-span-2"><Input label="Địa chỉ" value={f.address} onChange={(e) => set("address", e.target.value)} /></div><div className="sm:col-span-2 flex justify-end gap-3"><Btn variant="ghost" onClick={() => nav("customers")}>Hủy</Btn><Btn onClick={save}>Lưu</Btn></div></Card></div>;
};
const Suppliers = () => {
  const { suppliers, setSuppliers, inbounds, nav, toast } = useStore();
  const { sel, toggle, toggleAll, allChecked, setSel } = useSel(suppliers);
  const [detail, setDetail] = useState(null); const [edit, setEdit] = useState(null);
  const bought = (id) => inbounds.filter((ib) => ib.supplier === id).reduce((a, ib) => a + ib.lines.reduce((s, l) => s + l.qty * l.price, 0) - ib.discount, 0);
  const del = () => { setSuppliers((p) => p.filter((s) => !sel.includes(s.id))); toast(`Đã xóa ${sel.length}`); setSel([]); };
  const save = () => { setSuppliers((p) => p.map((s) => s.id === edit.id ? { ...edit, debt: Number(edit.debt) } : s)); toast("Đã cập nhật NCC"); setEdit(null); };
  return <div><PageHead title="Danh mục nhà cung cấp" desc={`${suppliers.length} NCC`} action={<Btn onClick={() => nav("supplier-new")}><Plus size={16} /> Tạo mới</Btn>} /><BulkBar count={sel.length} onDelete={del} onClear={() => setSel([])} />
    <Table head={[<Check checked={allChecked} onChange={toggleAll} />, "Mã", "Tên", "SĐT", "Tổng đã nhập", "Công nợ", ""]}>{suppliers.map((s) => <Row key={s.id}><Td><Check checked={sel.includes(s.id)} onChange={() => toggle(s.id)} /></Td><Td><button onClick={() => setDetail(s)} className="font-bold text-blue-600 hover:underline">{s.id}</button></Td><Td><button onClick={() => setDetail(s)} className="font-medium text-slate-800 hover:text-blue-600 hover:underline">{s.name}</button></Td><Td className="text-slate-500">{s.phone}</Td><Td className="font-semibold text-emerald-600">{fmt(bought(s.id))}</Td><Td className={s.debt > 0 ? "text-rose-600 font-medium" : "text-slate-400"}>{fmt(s.debt)}</Td><Td><div className="flex gap-1"><button onClick={() => setDetail(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Eye size={16} /></button><button onClick={() => setEdit({ ...s })} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"><Pencil size={16} /></button></div></Td></Row>)}</Table>
    <Modal open={!!detail} onClose={() => setDetail(null)} title={`Chi tiết NCC ${detail?.id}`} size="lg">{detail && <div className="space-y-4"><div className="grid grid-cols-2 gap-3 text-sm"><div><span className="text-slate-400">Tên:</span> <b>{detail.name}</b></div><div><span className="text-slate-400">Điện thoại:</span> <b>{detail.phone}</b></div><div><span className="text-slate-400">Email:</span> <b>{detail.email || "—"}</b></div><div className="col-span-2"><span className="text-slate-400">Địa chỉ:</span> <b>{detail.address || "—"}</b></div><div><span className="text-slate-400">Tổng đã nhập:</span> <b className="text-emerald-600">{fmt(bought(detail.id))}</b></div><div><span className="text-slate-400">Công nợ:</span> <b className={detail.debt > 0 ? "text-rose-600" : ""}>{fmt(detail.debt)}</b></div></div><div className="flex justify-end gap-3 pt-3 border-t border-slate-100"><Btn variant="ghost" onClick={() => setDetail(null)}>Đóng</Btn><Btn onClick={() => { setEdit({ ...detail }); setDetail(null); }}><Pencil size={16} /> Chỉnh sửa</Btn></div></div>}</Modal>
    <Modal open={!!edit} onClose={() => setEdit(null)} title={`Sửa NCC ${edit?.id}`}>{edit && <div className="space-y-4"><Input label="Tên *" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /><Input label="Điện thoại" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /><Input label="Email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /><Input label="Địa chỉ" value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} /><Input label="Công nợ" type="number" value={edit.debt} onChange={(e) => setEdit({ ...edit, debt: e.target.value })} /><div className="flex justify-end gap-3"><Btn variant="ghost" onClick={() => setEdit(null)}>Hủy</Btn><Btn onClick={save}>Lưu thay đổi</Btn></div></div>}</Modal>
  </div>;
};
const SupplierNew = () => {
  const { addSupplier, toast, nav } = useStore();
  const [f, setF] = useState({ name: "", phone: "", email: "", address: "" });
  const save = () => { if (!f.name) return toast("Nhập tên!"); addSupplier(f); toast("Đã tạo NCC"); nav("suppliers"); };
  return <div className="max-w-2xl"><PageHead title="Tạo NCC mới" /><Card className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label="Tên *" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /><Input label="Điện thoại" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /><Input label="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /><Input label="Địa chỉ" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /><div className="sm:col-span-2 flex justify-end gap-3"><Btn variant="ghost" onClick={() => nav("suppliers")}>Hủy</Btn><Btn onClick={save}>Lưu</Btn></div></Card></div>;
};

/* ============ CHI NHÁNH ============ */
const Branches = () => {
  const { branches, setBranches, toast } = useStore();
  const [modal, setModal] = useState(null);
  const save = () => { if (!modal.name) return toast("Nhập tên chi nhánh!"); if (modal.id) { setBranches((p) => p.map((b) => b.id === modal.id ? modal : b)); toast("Đã cập nhật"); } else { const id = "CN" + String(branches.length + 1).padStart(2, "0"); setBranches([...branches, { ...modal, id, central: false }]); toast("Đã tạo " + id); } setModal(null); };
  return <div><PageHead title="Chi nhánh" desc={`${branches.length} chi nhánh`} action={<Btn onClick={() => setModal({ name: "", address: "" })}><Plus size={16} /> Tạo chi nhánh</Btn>} /><Table head={["Mã", "Tên chi nhánh", "Địa chỉ", "Loại", ""]}>{branches.map((b) => <Row key={b.id}><Td className="font-bold text-blue-600">{b.id}</Td><Td className="font-medium">{b.name}</Td><Td className="text-slate-500">{b.address}</Td><Td>{b.central ? <Badge cls="bg-blue-50 text-blue-600 ring-blue-200">Kho Trung Tâm</Badge> : <Badge>Chi nhánh</Badge>}</Td><Td><button onClick={() => setModal({ ...b })} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"><Pencil size={16} /></button></Td></Row>)}</Table><Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? "Sửa chi nhánh" : "Tạo chi nhánh"}>{modal && <div className="space-y-4"><Input label="Tên chi nhánh *" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} /><Input label="Địa chỉ" value={modal.address} onChange={(e) => setModal({ ...modal, address: e.target.value })} /><div className="flex justify-end gap-3"><Btn variant="ghost" onClick={() => setModal(null)}>Hủy</Btn><Btn onClick={save}>Lưu</Btn></div></div>}</Modal></div>;
};

/* ============ TỒN KHO / CÔNG NỢ ============ */
const Inventory = () => {
  const { visProducts, branches, stock, canSeeCost } = useStore();
  return <div><PageHead title="Quản lý tồn kho" desc="Tồn theo từng chi nhánh" /><Table head={["Sản phẩm", ...branches.map((b) => b.name), "Tổng", ...(canSeeCost ? ["Giá trị tồn"] : [])]}>{visProducts.map((p) => { const tot = branches.reduce((a, b) => a + (stock[`${p.id}-${b.id}`] || 0), 0); return <Row key={p.id}><Td className="font-medium">{p.name}<div className="text-xs text-slate-400">{p.artist}</div></Td>{branches.map((b) => { const q = stock[`${p.id}-${b.id}`] || 0; return <Td key={b.id} className={q === 0 ? "text-slate-300" : "text-slate-700"}>{q}</Td>; })}<Td className="font-bold text-blue-600">{tot}</Td>{canSeeCost && <Td className="text-slate-600">{fmt(tot * p.cost)}</Td>}</Row>; })}</Table></div>;
};
const Debt = () => {
  const { customers, suppliers } = useStore();
  return <div><PageHead title="Quản lý công nợ" /><div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><div><h3 className="font-bold text-slate-700 mb-3">Phải thu (Khách hàng)</h3><Table head={["Khách hàng", "Công nợ"]}>{customers.filter((c) => c.debt > 0).map((c) => <Row key={c.id}><Td>{c.name}</Td><Td className="text-rose-600 font-semibold">{fmt(c.debt)}</Td></Row>)}</Table></div><div><h3 className="font-bold text-slate-700 mb-3">Phải trả (NCC)</h3><Table head={["Nhà cung cấp", "Công nợ"]}>{suppliers.filter((s) => s.debt > 0).map((s) => <Row key={s.id}><Td>{s.name}</Td><Td className="text-amber-600 font-semibold">{fmt(s.debt)}</Td></Row>)}</Table></div></div></div>;
};

/* ============ NHÂN VIÊN ============ */
const Employees = () => {
  const { employees, setEmployees, branches, toast, nav } = useStore();
  const { sel, toggle, toggleAll, allChecked, setSel } = useSel(employees);
  const [modal, setModal] = useState(null);
  const bName = (id) => branches.find((b) => b.id === id)?.name || id;
  const del = () => { setEmployees((p) => p.filter((e) => !sel.includes(e.id))); toast(`Đã xóa ${sel.length}`); setSel([]); };
  const save = () => { if (!modal.name || !modal.phone) return toast("Nhập tên & SĐT!"); if (modal.id) { setEmployees((p) => p.map((e) => e.id === modal.id ? modal : e)); } else { const id = "NV" + String(employees.length + 1).padStart(2, "0"); setEmployees([...employees, { ...modal, id }]); } toast("Đã lưu"); setModal(null); };
  return <div><PageHead title="Danh sách nhân viên" desc={`${employees.length} nhân viên`} action={<div className="flex gap-2"><Btn variant="outline" onClick={() => nav("roles")}><Shield size={16} /> Phân quyền</Btn><Btn onClick={() => setModal({ name: "", phone: "", email: "", password: "123456", role: "Sales", branchId: branches[0].id })}><Plus size={16} /> Thêm NV</Btn></div>} /><BulkBar count={sel.length} onDelete={del} onClear={() => setSel([])} /><Table head={[<Check checked={allChecked} onChange={toggleAll} />, "Mã", "Họ tên", "SĐT", "Email", "Vai trò", "Chi nhánh", ""]}>{employees.map((e) => <Row key={e.id}><Td><Check checked={sel.includes(e.id)} onChange={() => toggle(e.id)} /></Td><Td className="font-bold text-blue-600">{e.id}</Td><Td className="font-medium">{e.name}</Td><Td className="text-slate-500">{e.phone}</Td><Td className="text-slate-500">{e.email}</Td><Td>{e.role === "Admin" ? <Badge cls="bg-blue-50 text-blue-600 ring-blue-200">Admin</Badge> : <Badge cls="bg-cyan-50 text-cyan-600 ring-cyan-200">Sales</Badge>}</Td><Td className="text-slate-500">{bName(e.branchId)}</Td><Td><button onClick={() => setModal({ ...e })} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"><Pencil size={16} /></button></Td></Row>)}</Table><Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? "Sửa nhân viên" : "Thêm nhân viên"}>{modal && <div className="space-y-4"><Input label="Họ tên *" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} /><Input label="SĐT * (dùng đăng nhập)" value={modal.phone} onChange={(e) => setModal({ ...modal, phone: e.target.value })} /><Input label="Email" value={modal.email} onChange={(e) => setModal({ ...modal, email: e.target.value })} /><Input label="Mật khẩu" value={modal.password} onChange={(e) => setModal({ ...modal, password: e.target.value })} /><div className="grid grid-cols-2 gap-4"><Select label="Vai trò" value={modal.role} onChange={(e) => setModal({ ...modal, role: e.target.value })}><option>Admin</option><option>Sales</option></Select><Select label="Chi nhánh" value={modal.branchId} onChange={(e) => setModal({ ...modal, branchId: e.target.value })}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></div><div className="flex justify-end gap-3"><Btn variant="ghost" onClick={() => setModal(null)}>Hủy</Btn><Btn onClick={save}>Lưu</Btn></div></div>}</Modal></div>;
};
const Roles = () => {
  const { employees, setEmployees, branches, toast } = useStore();
  const perms = [{ f: "Xem SP & đơn hàng của chi nhánh mình", admin: true, sales: true }, { f: "Kho Trung Tâm: xem TẤT CẢ chi nhánh", admin: true, sales: false }, { f: "Xem giá nhập / giá vốn", admin: true, sales: false }, { f: "Công nợ, Báo cáo, Chi nhánh, Nhân viên", admin: true, sales: false }];
  const bName = (id) => branches.find((b) => b.id === id)?.name || id;
  return <div><PageHead title="Phân quyền nhân viên" desc="Admin (Kho Trung Tâm) thấy tất cả · Sales chỉ thấy chi nhánh mình" /><div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><Card className="p-5"><h3 className="font-bold text-slate-700 mb-4">Ma trận quyền</h3><Table head={["Chức năng", "Admin", "Sales"]}>{perms.map((p, i) => <Row key={i}><Td>{p.f}</Td><Td>{p.admin ? <CheckCircle2 size={18} className="text-emerald-500" /> : <X size={16} className="text-slate-300" />}</Td><Td>{p.sales ? <CheckCircle2 size={18} className="text-emerald-500" /> : <X size={16} className="text-rose-400" />}</Td></Row>)}</Table></Card><Card className="p-5"><h3 className="font-bold text-slate-700 mb-4">Gán vai trò & chi nhánh</h3><div className="space-y-3">{employees.map((e) => <div key={e.id} className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-100 flex-wrap"><div><p className="font-medium text-slate-800">{e.name}</p><p className="text-xs text-slate-400">{bName(e.branchId)}</p></div><div className="flex gap-2"><select value={e.role} onChange={(ev) => { setEmployees(employees.map((x) => x.id === e.id ? { ...x, role: ev.target.value } : x)); toast("Đã cập nhật"); }} className="px-2 py-1.5 rounded-lg border border-slate-300 text-sm"><option>Admin</option><option>Sales</option></select><select value={e.branchId} onChange={(ev) => { setEmployees(employees.map((x) => x.id === e.id ? { ...x, branchId: ev.target.value } : x)); toast("Đã cập nhật"); }} className="px-2 py-1.5 rounded-lg border border-slate-300 text-sm">{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div></div>)}</div></Card></div></div>;
};
const Reports = () => {
  const { visSales, visProducts, canSeeCost } = useStore();
  const revenue = visSales.reduce((s, o) => s + o.total, 0);
  const bar = visProducts.slice(0, 6).map((p) => ({ name: p.artist.split(" ")[0] || p.name.slice(0, 6), sl: Math.floor(Math.random() * 30) + 5 }));
  return <div><PageHead title="Báo cáo" /><div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"><StatCard icon={DollarSign} label="Doanh thu" value={fmt(revenue)} color="blue" /><StatCard icon={ShoppingCart} label="Số đơn" value={visSales.length} color="cyan" />{canSeeCost && <StatCard icon={TrendingUp} label="Lợi nhuận ước tính" value={fmt(revenue * 0.35)} color="emerald" />}</div><Card className="p-5"><h3 className="font-bold text-slate-800 mb-4">Top sản phẩm bán chạy</h3><ResponsiveContainer width="100%" height={300}><BarChart data={bar}><CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" /><XAxis dataKey="name" stroke="#94a3b8" fontSize={12} /><YAxis stroke="#94a3b8" fontSize={12} /><Tooltip /><Bar dataKey="sl" fill="#2563eb" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></Card></div>;
};

/* ============ LOGIN ============ */
const Login = ({ onLogin, employees }) => {
  const [phone, setPhone] = useState(""); const [pw, setPw] = useState(""); const [err, setErr] = useState("");
  const submit = () => { const u = employees.find((e) => e.phone === phone.trim() && e.password === pw); if (!u) return setErr("Sai số điện thoại hoặc mật khẩu!"); onLogin(u); };
  return <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center p-4"><div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-[popIn_.3s]"><div className="text-center mb-6"><div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto mb-3"><Disc3 size={32} /></div><h1 className="text-2xl font-bold text-slate-800">VinylHub</h1><p className="text-slate-400 text-sm">Đăng nhập quản lý đĩa than</p></div><div className="space-y-4"><div className="relative"><Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Số điện thoại" className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-500" /></div><div className="relative"><Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Mật khẩu" className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:border-blue-500" /></div>{err && <p className="text-rose-500 text-sm text-center">{err}</p>}<Btn onClick={submit} className="w-full !py-3">Đăng nhập</Btn><p className="text-xs text-slate-400 text-center">Demo: 0900000001 / 123456 (Admin)</p></div></div></div>;
};

/* ============ ROOT ============ */
export default function App() {
  const [me, setMe] = usePersist("vh_me", null);
  const [page, setPage] = useState("dashboard");
  const [sidebar, setSidebar] = useState(false);
  const [openMenus, setOpenMenus] = useState(["Sản phẩm"]);
  const [toastMsg, setToastMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inbounds, setInbounds] = useState([]);
  const [sales, setSales] = useState([]);
  const [stock, setStock] = useState({});
  const [employees, setEmployees] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);

  // 1) Tải toàn bộ dữ liệu từ Supabase khi mở app
  useEffect(() => {
    (async () => {
      try {
        const d = await loadAll();
        // Đồng bộ quyền của tài khoản đang đăng nhập với dữ liệu mới nhất
useEffect(() => {
  if (!loaded || !me) return;
  const fresh = employees.find(e => e.id === me.id);
  if (fresh && (fresh.role !== me.role || fresh.branchId !== me.branchId)) {
    setMe({ ...me, role: fresh.role, branchId: fresh.branchId });
  }
}, [employees, loaded]);
        setBranches(d.branches); setEmployees(d.employees); setProducts(d.products);
        setCustomers(d.customers); setSuppliers(d.suppliers); setInbounds(d.inbounds);
        setSales(d.sales); setStock(d.stock); setStockHistory(d.stockHistory);
        setLoaded(true);
      } catch (e) {
        console.error("Lỗi tải Supabase:", e);
        alert("Không tải được dữ liệu Supabase. Kiểm tra kết nối / đã tắt RLS chưa?");
      }
    })();
  }, []);

  // 2) Tự động LƯU lên Supabase mỗi khi dữ liệu thay đổi
  useEffect(() => { if (loaded) saveBranches(branches); }, [branches, loaded]);
  useEffect(() => { if (loaded) saveEmployees(employees); }, [employees, loaded]);
  useEffect(() => { if (loaded) saveProducts(products); }, [products, loaded]);
  useEffect(() => { if (loaded) saveCustomers(customers); }, [customers, loaded]);
  useEffect(() => { if (loaded) saveSuppliers(suppliers); }, [suppliers, loaded]);
  useEffect(() => { if (loaded) saveInbounds(inbounds); }, [inbounds, loaded]);
  useEffect(() => { if (loaded) saveSales(sales); }, [sales, loaded]);
  useEffect(() => { if (loaded) saveStock(stock); }, [stock, loaded]);
  useEffect(() => { if (loaded) saveHistory(stockHistory); }, [stockHistory, loaded]);

  const toast = (m) => { setToastMsg(m); setTimeout(() => setToastMsg(""), 2500); };
  const nav = (p) => { setPage(p); setSidebar(false); };
  const toggleMenu = (l) => setOpenMenus((o) => o.includes(l) ? o.filter((x) => x !== l) : [...o, l]);

  if (!loaded) return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500 text-sm">Đang tải dữ liệu từ đám mây…</div>;
  if (!me) return <><style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes popIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}`}</style><Login onLogin={setMe} employees={employees} /></>;

  const isAdmin = me.role === "Admin";
  const myBranch = branches.find((b) => b.id === me.branchId);
  const isCentralAdmin = isAdmin && !!myBranch?.central; // Admin của chi nhánh Trung Tâm
  const seeAll = isCentralAdmin;      // chỉ admin trung tâm thấy dữ liệu tất cả chi nhánh
  const canSeeCost = isCentralAdmin;  // chỉ admin trung tâm thấy giá nhập
  const canEdit = isCentralAdmin;     // chỉ admin trung tâm được thêm/sửa/xóa (Sales chỉ tạo đơn + tạo KH)

  // Dữ liệu đã lọc theo quyền
  const visProducts = seeAll ? products : products.filter((p) => p.branchId === me.branchId);
  const visSales = seeAll ? sales : sales.filter((o) => o.branchId === me.branchId);
  const visInbounds = seeAll ? inbounds : inbounds.filter((ib) => ib.branchId === me.branchId);

  const addSale = (o) => { setSales((p) => [o, ...p]); setStock((s) => { const n = { ...s }; o.lines.forEach((l) => { n[`${l.sku}-${o.branchId}`] = (n[`${l.sku}-${o.branchId}`] || 0) - l.qty; }); return n; }); setStockHistory((h) => [...o.lines.map((l) => ({ time: now(), doc: o.id, sku: l.sku, branch: o.branchId, type: "Xuất bán", qty: -l.qty, price: l.price })), ...h]); };
const doTransfer = (sku, from, to, qty) => {
  const n = Number(qty) || 0;
  if (n <= 0 || from === to) return;
  setStock(prev => {
    const cur = { ...prev };
    const k1 = `${sku}-${from}`, k2 = `${sku}-${to}`;
    cur[k1] = (cur[k1] || 0) - n;   // trừ kho gửi
    cur[k2] = (cur[k2] || 0) + n;   // cộng kho nhận
    return cur;
  });
  const doc = rnd("CK");
  setStockHistory(prev => [
    { time: now(), doc, sku, branch: from, type: "Chuyển đi", qty: -n, price: 0 },
    { time: now(), doc, sku, branch: to,   type: "Nhập kho",  qty:  n, price: 0 },
    ...prev
  ]);
};
  const importProducts = (rows, branchId, supplierId) => {
    // Tính giá vốn bình quân di động (toàn hệ thống)
    const avgCost = {};
    rows.forEach((r) => {
      const old = products.find((p) => p.id === r.id);
      const oldQty = Object.entries(stock).filter(([k]) => k.startsWith(`${r.id}-`)).reduce((s, [, v]) => s + v, 0);
      const oldCost = old ? (old.cost || 0) : 0;
      const newQty = r.qty || 0;
      const total = oldQty + newQty;
      avgCost[r.id] = total > 0 ? Math.round((oldQty * oldCost + newQty * (r.cost || 0)) / total) : (r.cost || 0);
    });
    setProducts((prev) => { const map = new Map(prev.map((p) => [p.id, p])); rows.forEach((r) => { const { qty, cost, ...pr } = r; map.set(r.id, { ...(map.get(r.id) || { artist: "", img: IMG(r.name.slice(0, 6)), createdAt: today() }), ...pr, cost: avgCost[r.id], updatedAt: today() }); }); return Array.from(map.values()); });
    setStock((prev) => { const s = { ...prev }; rows.forEach((r) => { const k = `${r.id}-${branchId}`; s[k] = (s[k] || 0) + (r.qty || 0); }); return s; });
    const id = rnd("PN");
    setInbounds((p) => [{ id, date: today(), supplier: supplierId, branchId, discount: 0, paid: 0, lines: rows.map((r) => ({ sku: r.id, qty: r.qty || 0, price: r.cost })) }, ...p]);
    setStockHistory((p) => [...rows.map((r) => ({ time: now(), doc: id, sku: r.id, branch: branchId, type: "Nhập kho", qty: r.qty || 0, price: r.cost })), ...p]);
  };
  const addSupplier = (f) => { const id = "NCC" + String(suppliers.length + 1).padStart(2, "0"); setSuppliers((p) => [...p, { id, ...f, debt: 0 }]); return id; };

  const store = { me, page, nav, openMenus, toggleMenu, toast, isAdmin, isCentralAdmin, canSeeCost, canEdit, seeAll, branches, setBranches, products, setProducts, visProducts, customers, setCustomers, suppliers, setSuppliers, addSupplier, inbounds, setInbounds, visInbounds, sales, setSales, visSales, stock, setStock, employees, setEmployees, stockHistory, addSale, doTransfer, importProducts };

  const PAGES = { dashboard: Dashboard, sales: SalesList, "sale-new": SaleNew, products: Products, "product-new": ProductNew, "inbound-list": InboundList, "inbound-excel": InboundExcel, transfer: Transfer, customers: Customers, "customer-new": CustomerNew, suppliers: Suppliers, "supplier-new": SupplierNew, branches: Branches, inventory: Inventory, debt: Debt, employees: Employees, roles: Roles, reports: Reports };
  const Current = PAGES[page] || Dashboard;

  return <Ctx.Provider value={store}><style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes popIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}`}</style>
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      <aside className={`fixed lg:sticky top-0 z-40 h-screen w-72 bg-white border-r border-slate-200 flex flex-col transition-transform ${sidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}><div className="p-5 border-b border-slate-100 flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white"><Disc3 size={24} /></div><div><p className="font-bold text-slate-800">VinylHub</p><p className="text-xs text-slate-400">{myBranch?.name}</p></div></div><nav className="flex-1 overflow-y-auto p-3 space-y-1">{NAV.map((n, i) => <NavNode key={i} node={n} />)}</nav><button onClick={() => setMe(null)} className="m-3 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"><LogOut size={18} /> Đăng xuất</button></aside>
      {sidebar && <div className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={() => setSidebar(false)} />}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center gap-3"><button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebar(true)}><Menu size={20} /></button><div className="flex-1" /><button className="p-2 rounded-lg hover:bg-slate-100 relative"><Bell size={19} className="text-slate-500" /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" /></button><div className="flex items-center gap-2 pl-2 border-l border-slate-200"><div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">{me.name[0]}</div><div className="hidden sm:block"><p className="text-sm font-semibold text-slate-700">{me.name}</p><p className="text-xs text-slate-400">{me.role} · {myBranch?.name}</p></div></div></header>
        <main className="flex-1 p-4 sm:p-6 animate-[fadeIn_.3s]"><Current /></main>
      </div>
    </div>
    <Toast msg={toastMsg} />
  </Ctx.Provider>;
}